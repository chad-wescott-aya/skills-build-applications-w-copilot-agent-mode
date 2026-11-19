import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (input === null || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length === 0) {
    throw Object.assign(new Error('Activity request body is required'), { status: 400 });
  }

  const type = Reflect.get(input, 'type');
  const minutes = Reflect.get(input, 'minutes');
  if (typeof type !== 'string' || type.trim().length === 0 || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Activity type and positive minutes are required'), { status: 400 });
  }

  const userId = Reflect.get(input, 'userId');
  const teamId = Reflect.get(input, 'teamId');
  if (
    typeof userId !== 'string' ||
    typeof teamId !== 'string' ||
    !mongoose.isObjectIdOrHexString(userId) ||
    !mongoose.isObjectIdOrHexString(teamId)
  ) {
    throw Object.assign(new Error('Activity userId and teamId must be valid IDs'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user and team must exist'), { status: 400 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team request body is required'), { status: 400 });
  }

  const name = Reflect.get(input, 'name');
  const mascot = Reflect.get(input, 'mascot');
  const members = Reflect.get(input, 'members');
  if (typeof name !== 'string' || name.trim().length === 0 || typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw Object.assign(new Error('Team name and mascot are required'), { status: 400 });
  }
  if (
    members !== undefined &&
    (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isObjectIdOrHexString(member)))
  ) {
    throw Object.assign(new Error('Team members must be an array of valid user IDs'), { status: 400 });
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: members ?? [],
  });
}

export async function getLeaderboard() {
  const totals = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $set: { totalPoints: { $sum: '$activities.points' } } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('No user found for that email'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    running: 'endurance',
    cycle: 'endurance',
    cycling: 'endurance',
    walk: 'endurance',
    walking: 'endurance',
    strength: 'strength',
  };
  const recentFocus = recentActivity
    ? activityFocus[recentActivity.type.toLowerCase()] ?? recentActivity.type
    : undefined;
  const preferredFocus = recentFocus && workouts.some((workout) => workout.focus.toLowerCase() === recentFocus.toLowerCase())
    ? recentFocus
    : user.fitnessGoal;
  const reason = recentActivity && preferredFocus === recentFocus
    ? `Recommended based on your recent ${recentActivity.type} activity.`
    : `Recommended based on your ${user.fitnessGoal} fitness goal.`;

  return workouts
    .sort((left, right) => Number(right.focus.toLowerCase() === preferredFocus.toLowerCase()) - Number(left.focus.toLowerCase() === preferredFocus.toLowerCase()))
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === preferredFocus.toLowerCase()
        ? reason
        : `Suggested to support your ${user.fitnessGoal} fitness goal.`,
    }));
}

export { User };
