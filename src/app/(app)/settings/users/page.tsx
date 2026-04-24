'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'rep'
  is_active: boolean
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Christine', email: 'christine@gobolt.com', role: 'admin', is_active: true },
  { id: '2', name: 'Sajjad', email: 'sajjad@gobolt.com', role: 'rep', is_active: true },
  { id: '3', name: 'Yuliia', email: 'yuliia@gobolt.com', role: 'rep', is_active: true },
  { id: '4', name: 'Baz', email: 'baz@gobolt.com', role: 'rep', is_active: true },
  { id: '5', name: 'Rakshita', email: 'rakshita@gobolt.com', role: 'rep', is_active: true },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'rep'>('rep')

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) {
      alert('Please fill in all fields')
      return
    }

    // TODO: Implement API call to add user
    const newUser: User = {
      id: String(users.length + 1),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      is_active: true,
    }
    setUsers([...users, newUser])
    setNewUserEmail('')
    setNewUserName('')
    setNewUserRole('rep')
  }

  const handleRemoveUser = (userId: string) => {
    // TODO: Implement API call to remove user
    setUsers(users.filter(u => u.id !== userId))
  }

  const handleToggleRole = (userId: string) => {
    // TODO: Implement API call to update user role
    setUsers(
      users.map(u =>
        u.id === userId ? { ...u, role: u.role === 'admin' ? 'rep' : 'admin' } : u
      )
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-1">
          Add, remove, and manage user roles (Admin or AR Rep)
        </p>
      </div>

      {/* Add User Form */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Add New User</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="User name"
              className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@gobolt.com"
              className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Role
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'rep')}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="rep">AR Rep</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700">
          Add User
        </Button>
      </Card>

      {/* Users List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'AR Rep'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="text-green-600 font-medium">Active</span>
                  </td>
                  <td className="py-3 px-4 text-sm space-x-2">
                    <button
                      onClick={() => handleToggleRole(user.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
