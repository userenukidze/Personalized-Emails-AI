import React, { useRef } from 'react';
import '../ComponentStyles/FileUploadCSS.css';
import { IoIosRemoveCircle } from "react-icons/io";

interface FileUploadProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const FileUpload: React.FC<FileUploadProps> = ({ uploadedFiles, setUploadedFiles }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev =>
        [...prev, ...newFiles].filter(
          (file, idx, arr) => arr.findIndex(f => f.name === file.name && f.size === file.size) === idx
        )
      );
      e.target.value = '';
    }
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="file-upload-section">
      <label className="file-upload-label">Attach Files:</label>
      <div
        className="file-dropzone"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      >
        <span>Click or drag files here to upload</span>
        <input
          type="file"
          multiple
          ref={inputRef}
          className="file-input-hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="file-list">
        {uploadedFiles.map((file, idx) => (
          <div className="file-chip" key={idx}>
            {file.name}
            <IoIosRemoveCircle
              className="file-remove-icon"
              size={20}
              title="Remove file"
              onClick={e => {
                e.stopPropagation();
                handleRemoveFile(idx);
              }}
              style={{ marginLeft: 8, cursor: 'pointer', color: '#e57373', verticalAlign: 'middle' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUpload;