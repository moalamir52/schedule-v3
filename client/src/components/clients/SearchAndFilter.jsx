import { useState } from 'react';
function SearchAndFilter({ onSearch, onFilter, onExport, onImport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    package: ''
  });
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImport(file);
    }
  };
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Bar */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              width: '100%',
              padding: '10px 15px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        {/* Package Filter */}
        <div>
          <select
            value={filters.package}
            onChange={(e) => handleFilterChange('package', e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">All Packages</option>
            <option value="2 Ext ">2 Ext</option>
            <option value="2 Ext 1 INT week">2 Ext 1 INT week</option>
            <option value="3 Ext 1 INT week">3 Ext 1 INT week</option>
            <option value="2 Ext 1 INT bi week">2 Ext 1 INT bi week</option>
            <option value="3 Ext 1 INT bi week">3 Ext 1 INT bi week</option>
            <option value="3 Ext 1 INT bi week ">3 Ext 1 INT bi week</option>
          </select>
        </div>
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onExport}
            className="btn btn-success"
            style={{ fontSize: '14px', padding: '10px 15px' }}
          >
            📊 Export
          </button>
          <label style={{
            backgroundColor: '#17a2b8',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            border: 'none'
          }}>
            📁 Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
export default SearchAndFilter;