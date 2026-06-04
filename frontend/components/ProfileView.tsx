import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api';
import ProfileInfoCard from './profile/ProfileInfoCard';
import ProfileHistoryTable from './profile/ProfileHistoryTable';
import EditProfileModal from './profile/EditProfileModal';
import ChangePasswordModal from './profile/ChangePasswordModal';
import TransactionDetailModal from './profile/TransactionDetailModal';

interface ProfileViewProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getTokenHistory();
      setTransactions(data.history || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Card containing everything inside */}
        <ProfileInfoCard
          user={user}
          onUpdateName={() => setEditOpen(true)}
          onChangePassword={() => setChangePwOpen(true)}
        />

        {/* Transaction History Table */}
        <ProfileHistoryTable
          transactions={transactions}
          loading={loading}
          onViewTx={(tx) => setSelectedTx(tx)}
        />
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSuccess={onUpdateUser}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePwOpen}
        user={user}
        onClose={() => setChangePwOpen(false)}
      />

      {/* Transaction Details Modal */}
      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};

export default ProfileView;
