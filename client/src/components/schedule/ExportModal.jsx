import React, { useState } from 'react';
const ExportModal = ({ isOpen, onClose, assignedSchedule, workers }) => {
  const [exportType, setExportType] = useState('daily');
  const [selectedDay, setSelectedDay] = useState('Saturday');
  const [selectedWorker, setSelectedWorker] = useState('all');
  const [exportFormat, setExportFormat] = useState('image');
  const daysOfWeek = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (!isOpen) return null;
  const handleExport = async () => {
    if (exportFormat === 'csv') {
      // CSV Export
      const csvData = [
        ['Day', 'Time', 'Customer', 'Villa', 'Car Plate', 'Wash Type', 'Worker', 'Package Type']
      ];
      let filteredData = assignedSchedule;
      if (exportType === 'daily') {
        filteredData = filteredData.filter(item => item.day === selectedDay);
      }
      if (selectedWorker !== 'all') {
        filteredData = filteredData.filter(item => item.workerName === selectedWorker);
      }
      // Sort data by time only (workers already in database order)
      filteredData.sort((a, b) => {
        const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
        return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
      });
      filteredData.forEach(item => {
        csvData.push([
          item.day || '',
          item.time || '',
          item.customerName || '',
          item.villa || '',
          item.carPlate || '',
          item.washType || '',
          item.workerName || '',
          item.packageType || ''
        ]);
      });
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${exportType}-${selectedWorker}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (exportFormat === 'image') {
      // Image Export
      await exportAsImage();
    } else if (exportFormat === 'workers_images') {
      // Export each worker as separate image
      await exportWorkersAsImages();
    }
    onClose();
  };
  const exportAsImage = async () => {
    const { default: html2canvas } = await import('html2canvas');
    let filteredData = assignedSchedule;
    if (exportType === 'daily') {
      filteredData = filteredData.filter(item => item.day === selectedDay);
    }
    if (selectedWorker !== 'all') {
      filteredData = filteredData.filter(item => item.workerName === selectedWorker);
    }
    // Create temporary div for image generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.width = '800px';
    const title = document.createElement('h2');
    title.textContent = `${selectedWorker === 'all' ? 'All Workers' : selectedWorker} - ${exportType === 'daily' ? selectedDay : 'Weekly Schedule'}`;
    title.style.textAlign = 'center';
    title.style.color = '#28a745';
    title.style.marginBottom = '20px';
    tempDiv.appendChild(title);
    if (selectedWorker === 'all') {
      // Show each worker separately - use database order (WorkerID)
      workers.forEach(worker => {
        const workerData = filteredData.filter(item => item.workerName === worker.Name);
        if (workerData.length === 0) return;
        // Worker title
        const workerTitle = document.createElement('h3');
        workerTitle.textContent = worker.Name;
        workerTitle.style.color = '#28a745';
        workerTitle.style.marginTop = '30px';
        workerTitle.style.marginBottom = '10px';
        tempDiv.appendChild(workerTitle);
        // Group by time and villa
        const groupedByTime = {};
        workerData.forEach(appt => {
          const key = `${appt.time}-${appt.villa}`;
          if (!groupedByTime[key]) {
            groupedByTime[key] = {
              time: appt.time,
              villa: appt.villa,
              cars: []
            };
          }
          if (appt.carPlate) {
            groupedByTime[key].cars.push(`${appt.carPlate} (${appt.washType})`);
          }
        });
        // Sort by time
        const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
        const sortedGroups = Object.values(groupedByTime).sort((a, b) => {
          return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
        });
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.marginBottom = '20px';
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['⏰ Time', '🏠 Villa', '🚗 Cars & Wash Type'];
        headers.forEach(headerText => {
          const th = document.createElement('th');
          th.textContent = headerText;
          th.style.backgroundColor = '#28a745';
          th.style.color = 'white';
          th.style.fontWeight = '900';
          th.style.fontSize = '14px';
          th.style.padding = '10px';
          th.style.textAlign = 'center';
          th.style.border = '1px solid white';
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        sortedGroups.forEach(group => {
          const tr = document.createElement('tr');
          const timeCell = document.createElement('td');
          timeCell.textContent = group.time;
          timeCell.style.backgroundColor = '#e0eac9';
          timeCell.style.padding = '8px';
          timeCell.style.border = '1px solid #d3dfbb';
          timeCell.style.fontSize = '12px';
          timeCell.style.fontWeight = '600';
          timeCell.style.textAlign = 'center';
          tr.appendChild(timeCell);
          const villaCell = document.createElement('td');
          villaCell.textContent = group.villa;
          villaCell.style.backgroundColor = '#e0eac9';
          villaCell.style.padding = '8px';
          villaCell.style.border = '1px solid #d3dfbb';
          villaCell.style.fontSize = '12px';
          villaCell.style.fontWeight = '600';
          villaCell.style.textAlign = 'center';
          tr.appendChild(villaCell);
          const carsCell = document.createElement('td');
          carsCell.textContent = group.cars.length > 0 ? group.cars.join(', ') : 'N/A';
          carsCell.style.backgroundColor = '#e0eac9';
          carsCell.style.padding = '8px';
          carsCell.style.border = '1px solid #d3dfbb';
          carsCell.style.fontSize = '12px';
          carsCell.style.fontWeight = '600';
          carsCell.style.textAlign = 'center';
          tr.appendChild(carsCell);
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tempDiv.appendChild(table);
      });
    } else {
      // Single worker view - same as grouped view
      const groupedByTime = {};
      filteredData.forEach(appt => {
        const key = `${appt.time}-${appt.villa}`;
        if (!groupedByTime[key]) {
          groupedByTime[key] = {
            time: appt.time,
            villa: appt.villa,
            cars: []
          };
        }
        if (appt.carPlate) {
          groupedByTime[key].cars.push(`${appt.carPlate} (${appt.washType})`);
        }
      });
      // Sort by time
      const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
      const sortedGroups = Object.values(groupedByTime).sort((a, b) => {
        return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
      });
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headers = ['⏰ Time', '🏠 Villa', '🚗 Cars & Wash Type'];
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.backgroundColor = '#28a745';
        th.style.color = 'white';
        th.style.fontWeight = '900';
        th.style.fontSize = '14px';
        th.style.padding = '10px';
        th.style.textAlign = 'center';
        th.style.border = '1px solid white';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      sortedGroups.forEach(group => {
        const tr = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = group.time;
        timeCell.style.backgroundColor = '#e0eac9';
        timeCell.style.padding = '8px';
        timeCell.style.border = '1px solid #d3dfbb';
        timeCell.style.fontSize = '12px';
        timeCell.style.fontWeight = '600';
        timeCell.style.textAlign = 'center';
        tr.appendChild(timeCell);
        const villaCell = document.createElement('td');
        villaCell.textContent = group.villa;
        villaCell.style.backgroundColor = '#e0eac9';
        villaCell.style.padding = '8px';
        villaCell.style.border = '1px solid #d3dfbb';
        villaCell.style.fontSize = '12px';
        villaCell.style.fontWeight = '600';
        villaCell.style.textAlign = 'center';
        tr.appendChild(villaCell);
        const carsCell = document.createElement('td');
        carsCell.textContent = group.cars.length > 0 ? group.cars.join(', ') : 'N/A';
        carsCell.style.backgroundColor = '#e0eac9';
        carsCell.style.padding = '8px';
        carsCell.style.border = '1px solid #d3dfbb';
        carsCell.style.fontSize = '12px';
        carsCell.style.fontWeight = '600';
        carsCell.style.textAlign = 'center';
        tr.appendChild(carsCell);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tempDiv.appendChild(table);
    }
    document.body.appendChild(tempDiv);
    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: 'white',
        scale: 2
      });
      document.body.removeChild(tempDiv);
      canvas.toBlob(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedWorker === 'all' ? 'All_Workers' : selectedWorker}_${exportType === 'daily' ? selectedDay : 'Weekly'}_Schedule.png`;
        a.click();
        window.URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      document.body.removeChild(tempDiv);
    }
  };
  const exportWorkersAsImages = async () => {
    const { default: html2canvas } = await import('html2canvas');
    // Use database order (WorkerID)
    for (const worker of workers) {
      const workerAppointments = assignedSchedule.filter(appt => 
        appt.day === selectedDay && appt.workerName === worker.Name
      ).sort((a, b) => {
        const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
        return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
      });
      if (workerAppointments.length === 0) continue;
      // Group appointments by time and villa to show villa once with all cars
      const groupedByTime = {};
      workerAppointments.forEach(appt => {
        const key = `${appt.time}-${appt.villa}`;
        if (!groupedByTime[key]) {
          groupedByTime[key] = {
            time: appt.time,
            villa: appt.villa,
            cars: []
          };
        }
        if (appt.carPlate) {
          groupedByTime[key].cars.push(`${appt.carPlate} (${appt.washType})`);
        }
      });
      // Sort grouped data by time
      const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
      const sortedGroups = Object.values(groupedByTime).sort((a, b) => {
        return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
      });
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.width = '900px';
      const title = document.createElement('h2');
      title.textContent = `${worker.Name} - ${selectedDay}`;
      title.style.textAlign = 'center';
      title.style.color = '#28a745';
      title.style.marginBottom = '20px';
      tempDiv.appendChild(title);
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headers = ['⏰ Time', '🏠 Villa', '🚗 Cars & Wash Type'];
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.backgroundColor = '#28a745';
        th.style.color = 'white';
        th.style.fontWeight = '900';
        th.style.fontSize = '14px';
        th.style.padding = '10px';
        th.style.textAlign = 'center';
        th.style.border = '1px solid white';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      sortedGroups.forEach(group => {
        const tr = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = group.time;
        timeCell.style.backgroundColor = '#e0eac9';
        timeCell.style.padding = '8px';
        timeCell.style.border = '1px solid #d3dfbb';
        timeCell.style.fontSize = '12px';
        timeCell.style.fontWeight = '600';
        timeCell.style.textAlign = 'center';
        tr.appendChild(timeCell);
        const villaCell = document.createElement('td');
        villaCell.textContent = group.villa;
        villaCell.style.backgroundColor = '#e0eac9';
        villaCell.style.padding = '8px';
        villaCell.style.border = '1px solid #d3dfbb';
        villaCell.style.fontSize = '12px';
        villaCell.style.fontWeight = '600';
        villaCell.style.textAlign = 'center';
        tr.appendChild(villaCell);
        const carsCell = document.createElement('td');
        carsCell.textContent = group.cars.length > 0 ? group.cars.join(', ') : 'N/A';
        carsCell.style.backgroundColor = '#e0eac9';
        carsCell.style.padding = '8px';
        carsCell.style.border = '1px solid #d3dfbb';
        carsCell.style.fontSize = '12px';
        carsCell.style.fontWeight = '600';
        carsCell.style.textAlign = 'center';
        tr.appendChild(carsCell);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tempDiv.appendChild(table);
      document.body.appendChild(tempDiv);
      try {
        const canvas = await html2canvas(tempDiv, {
          backgroundColor: 'white',
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        document.body.removeChild(tempDiv);
        canvas.toBlob(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${worker.Name}_${selectedDay}_Schedule.png`;
          a.click();
          window.URL.revokeObjectURL(url);
        }, 'image/png', 0.95);
        // Wait between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        document.body.removeChild(tempDiv);
      }
    }
  };
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        minWidth: '500px',
        maxWidth: '600px',
        width: '90%'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            color: '#28a745',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: '0 0 1rem 0'
          }}>📊 Export Schedule</h2>
          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            margin: '0'
          }}>Generate schedule report as CSV file or image</p>
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>📅 Export Type:</label>
            <select 
              value={exportType} 
              onChange={(e) => setExportType(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                backgroundColor: '#f9fafb'
              }}
            >
              <option value="daily">Daily Schedule</option>
              <option value="weekly">Weekly Schedule</option>
            </select>
          </div>
          {exportType === 'daily' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151'
              }}>🗓️ Select Day:</label>
              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)} 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb'
                }}
              >
                {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>👷 For Worker:</label>
            <select 
              value={selectedWorker} 
              onChange={(e) => setSelectedWorker(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                backgroundColor: '#f9fafb'
              }}
            >
              <option value="all">All Workers</option>
              {workers.map(worker => (
                <option key={worker.WorkerID || worker.Name} value={worker.Name}>
                  {worker.Name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>📄 Export Format:</label>
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                backgroundColor: '#f9fafb'
              }}
            >
              <option value="image">🖼️ Image (PNG)</option>
              <option value="csv">📊 CSV File</option>
              {exportType === 'daily' && <option value="workers_images">👷 Workers Images (Each Worker Separate)</option>}
            </select>
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button 
            onClick={handleExport} 
            style={{
              background: '#28a745',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📥 Generate Export
          </button>
          <button 
            onClick={onClose} 
            style={{
              background: '#6c757d',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportModal;