import React, { useRef, useState } from 'react'
import { UploadCloud, Image, FileVideo, AlertCircle, FilePlus2 } from 'lucide-react'

function MediaUploader({ file, onFileSelect, onRemove, acceptTypes = 'image/*,video/*' }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    inputRef.current.click()
  }

  // Format file size helper
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  return (
    <div className="form-group">
      <label>Post Media Content</label>
      
      {!file ? (
        <div 
          className={`media-uploader ${dragActive ? 'drag-over' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input 
            ref={inputRef}
            type="file" 
            className="form-control" 
            style={{ display: 'none' }}
            accept={acceptTypes}
            onChange={handleFileInput}
          />
          <UploadCloud size={40} className="upload-icon" />
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Drag & drop your media here</p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
              or <span style={{ color: '#7c3aed', textDecoration: 'underline' }}>browse files</span> from your computer
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.35)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Image size={14} /> Images (PNG, JPG)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileVideo size={14} /> Videos (MP4)
            </span>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="uploader-preview-container">
            {file.type.startsWith('image/') ? (
              <img 
                src={URL.createObjectURL(file)} 
                alt="Upload Preview" 
                className="uploader-preview-img"
              />
            ) : (
              <video 
                src={URL.createObjectURL(file)} 
                controls 
                className="uploader-preview-video"
              />
            )}
            <button 
              type="button"
              className="uploader-remove-btn" 
              onClick={onRemove}
              title="Remove media file"
            >
              &times;
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            {file.type.startsWith('image/') ? (
              <Image size={24} style={{ color: '#06b6d4' }} />
            ) : (
              <FileVideo size={24} style={{ color: '#7c3aed' }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                {formatBytes(file.size)} • {file.type.split('/')[1].toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaUploader
