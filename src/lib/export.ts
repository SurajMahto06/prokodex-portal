export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Convert array of objects to CSV string
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header];
        if (cell === null || cell === undefined) cell = '';
        if (typeof cell === 'object') cell = JSON.stringify(cell);
        
        // Convert to string and escape quotes
        cell = String(cell).replace(/"/g, '""');
        
        // Wrap in quotes if it contains comma, newline or quotes
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  
  // Create Blob and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
