import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import MuxPlayer from '@mux/mux-player-react';
import './Upload.css';
import { useNavigate } from 'react-router-dom';

function Upload() {
     const DOMAIN = import.meta.env.VITE_DOMAIN || 'http://localhost:3000';
     const navigate = useNavigate();
     const [videoFile, setVideoFile] = useState(null);
     const [posterFile, setPosterFile] = useState(null);
     const [trailerFile, setTrailerFile] = useState(null);
     const [playbackId, setPlaybackId] = useState('');
     const [progress, setProgress] = useState(0);
     const [uploading, setUploading] = useState(false);
     const [movieTitle, setMovieTitle] = useState('');
     const [description, setDescription] = useState('');

     // Dropzone for video
     const {
          getRootProps: getVideoRootProps,
          getInputProps: getVideoInputProps,
          isDragActive: isVideoDragActive
     } = useDropzone({
          accept: { 'video/*': [] },
          multiple: false,
          onDrop: (acceptedFiles) => {
               setVideoFile(acceptedFiles[0]);
          }
     });

     // Dropzone for poster
     const {
          getRootProps: getPosterRootProps,
          getInputProps: getPosterInputProps,
          isDragActive: isPosterDragActive
     } = useDropzone({
          accept: { 'image/*': [] },
          multiple: false,
          onDrop: (acceptedFiles) => {
               setPosterFile(acceptedFiles[0]);
          }
     });

     // Dropzone for trailer
     const {
          getRootProps: getTrailerRootProps,
          getInputProps: getTrailerInputProps,
          isDragActive: isTrailerDragActive
     } = useDropzone({
          accept: { 'video/*': [] },
          multiple: false,
          onDrop: (acceptedFiles) => {
               setTrailerFile(acceptedFiles[0]);
          }
     });

     const handleUpload = async () => {
          if (!videoFile || !posterFile || !trailerFile || !movieTitle || !description) {
               alert("Please fill all fields and select video, trailer, and poster.");
               return;
          }
          setUploading(true);
          setProgress(0);
          try {
               // 1. Get direct upload URL and uploadId from backend for main video
               const { data } = await axios.post(`${DOMAIN}/mux-direct-upload`);
               const uploadUrl = data.url;
               const uploadId = data.uploadId;

               // 2. Upload main video directly to Mux
               await axios.put(uploadUrl, videoFile, {
                    headers: { 'Content-Type': videoFile.type },
                    onUploadProgress: (evt) => {
                         setProgress(Math.round((evt.loaded * 100) / evt.total));
                    }
               });

               // 3. Poll backend for asset status and playbackId
               const pollMuxAsset = async (uploadId) => {
                    for (let i = 0; i < 30; i++) {
                         const res = await axios.get(`${DOMAIN}/mux-asset-status/${uploadId}`);
                         if (res.data.playbackId) return res.data.playbackId;
                         await new Promise(r => setTimeout(r, 1000));
                    }
                    throw new Error('Mux asset not ready');
               };

               const playbackId = await pollMuxAsset(uploadId);
               setPlaybackId(playbackId);

               // 4. Insert movie info and get movieId
               const { data: movieData } = await axios.post(`${DOMAIN}/upload-movie-mux`, {
                    movieTitle,
                    description,
                    playbackId
               });
               const movieId = movieData.id;

               // 5. Upload trailer and poster to ImageKit via backend
               const formData = new FormData();
               formData.append('trailer', trailerFile);
               formData.append('poster', posterFile);
               formData.append('title', movieTitle);

               await axios.post(`${DOMAIN}/upload-trailer-poster/${movieId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
               });

               alert('Movie uploaded successfully!');

               // Reset form
               setVideoFile(null);
               setPosterFile(null);
               setTrailerFile(null);
               setMovieTitle('');
               setDescription('');
               setPlaybackId('');

               navigate('/');

          } catch (error) {
               console.error("Upload failed:", error);
               alert('Failed to upload movie: ' + (error.response?.data || error.message));
          }
          setUploading(false);
     };

     return (
          <div className="upload-container">
               <h1 className="upload-title">Upload Movie</h1>

               <div>
                    <label className="upload-label">Movie Title</label>
                    <input
                         type="text"
                         className="upload-input"
                         value={movieTitle}
                         onChange={e => setMovieTitle(e.target.value)}
                         placeholder="Enter movie title"
                         required
                    />
               </div>

               <div>
                    <label className="upload-label">Description</label>
                    <textarea
                         className="upload-textarea"
                         value={description}
                         onChange={e => setDescription(e.target.value)}
                         placeholder="Enter description"
                         required
                    />
               </div>

               <div>
                    <label className="upload-label">Main Video (will be uploaded to Mux)</label>
                    <div {...getVideoRootProps()} className="dropzone">
                         <input {...getVideoInputProps()} />
                         {videoFile
                              ? <span>✅ {videoFile.name}</span>
                              : isVideoDragActive
                                   ? <span>Drop the video here ...</span>
                                   : <span>Drag & drop main video here, or click to select</span>
                         }
                    </div>
               </div>

               <div>
                    <label className="upload-label">Poster Image</label>
                    <div {...getPosterRootProps()} className="dropzone">
                         <input {...getPosterInputProps()} />
                         {posterFile
                              ? <span>✅ {posterFile.name}</span>
                              : isPosterDragActive
                                   ? <span>Drop the poster image here ...</span>
                                   : <span>Drag & drop poster image here, or click to select</span>
                         }
                    </div>
               </div>

               <div>
                    <label className="upload-label">Trailer Video</label>
                    <div {...getTrailerRootProps()} className="dropzone">
                         <input {...getTrailerInputProps()} />
                         {trailerFile
                              ? <span>✅ {trailerFile.name}</span>
                              : isTrailerDragActive
                                   ? <span>Drop the trailer here ...</span>
                                   : <span>Drag & drop trailer video here, or click to select</span>
                         }
                    </div>
               </div>

               {/* Show MuxPlayer after upload */}
               {playbackId && (
                    <div className="upload-mux-player">
                         <h3>Preview:</h3>
                         <MuxPlayer
                              playbackId={playbackId}
                              streamType="on-demand"
                              metadataVideoTitle={movieTitle}
                              style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8 }}
                         />
                    </div>
               )}

               {uploading && (
                    <div className="upload-progress">
                         <p>Uploading... {progress}%</p>
                         <div className="upload-progress-bar-bg">
                              <div
                                   className="upload-progress-bar"
                                   style={{ width: `${progress}%` }}
                              />
                         </div>
                    </div>
               )}

               <div>
                    <button
                         className="upload-btn"
                         onClick={handleUpload}
                         disabled={uploading || !videoFile || !posterFile || !trailerFile || !movieTitle || !description}
                    >
                         {uploading ? `Uploading... ${progress}%` : "Upload Movie"}
                    </button>
               </div>
          </div>
     );
}

export default Upload;