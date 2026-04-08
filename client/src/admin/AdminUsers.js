import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import AdminLayout from './AdminLayout';
import { Loader } from '../components/Loader';
import { toast } from 'react-toastify';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="admin-users">
        <div className="admin-page-header">
          <h1 className="display-font">USERS</h1>
          <p className="text-muted">{users.length} registered accounts</p>
        </div>

        <div className="admin-search-bar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? <Loader /> : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 36, height: 36,
                            background: user.isAdmin ? 'var(--accent)' : 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem', fontWeight: 700, color: user.isAdmin ? 'white' : 'var(--text-secondary)',
                            flexShrink: 0,
                          }}>
                            {user.name[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {user.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        {user.isAdmin
                          ? <span className="badge badge-red">Admin</span>
                          : <span className="badge badge-gray">Customer</span>
                        }
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
