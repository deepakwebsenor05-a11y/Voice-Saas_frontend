import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onUpload: (numbers: string[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const file = e.target.files?.[0];
      if (!file) return;
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      // Try common column names for phone numbers
      const phoneNumbers = jsonData.map((row) => row.phone || row.number || row.phoneNumber || row.Phone || row['Phone']).filter(Boolean);
      onUpload(phoneNumbers as string[]);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={loading}
      />
      {loading && <p>Processing...</p>}
    </div>
  );
};
