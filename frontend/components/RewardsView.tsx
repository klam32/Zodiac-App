import React from 'react';
import { User } from '../types';
import DailyCosmicQuest from './DailyCosmicQuest';

interface RewardsViewProps {
  user: User | null;
  onBalanceUpdate: (balance: number) => void;
}

const RewardsView: React.FC<RewardsViewProps> = ({ user, onBalanceUpdate }) => {
  return <DailyCosmicQuest user={user} onBalanceUpdate={onBalanceUpdate} />;
};

export default RewardsView;
