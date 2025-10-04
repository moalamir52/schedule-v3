function UsersTable({ users }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.UserID}>
            <td>{user.Username}</td>
            <td>{user.Role}</td>
            <td>{user.Status}</td>
            <td>
              <button className="btn btn-primary btn-sm me-2">Edit</button>
              <button className="btn btn-danger btn-sm">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UsersTable;