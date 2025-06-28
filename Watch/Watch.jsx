import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MuxPlayer from '@mux/mux-player-react'
import { IoArrowBack, IoPlay, IoPause, IoVolumeHigh, IoVolumeMute, IoExpand, IoContract } from 'react-icons/io5'
import { MdReplay10, MdForward10 } from 'react-icons/md'
import './Watch.css'

function Watch() {
     const { id } = useParams();
     const navigate = useNavigate();
     const playerRef = useRef(null);
     const [movieData, setMovieData] = useState(null);
     const [isFullscreen, setIsFullscreen] = useState(false);
     const [showControls, setShowControls] = useState(true);
     const [isPlaying, setIsPlaying] = useState(false);
     const [isMuted, setIsMuted] = useState(false);
     const [currentTime, setCurrentTime] = useState(0);
     const [duration, setDuration] = useState(0);
     const [volume, setVolume] = useState(50);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
          // Get movie data from localStorage
          const title = localStorage.getItem('movie-title') || 'Unknown Movie';
          const poster = localStorage.getItem('movie-poster') || '';
          setMovieData({ title, poster });

          // Auto-hide controls after 3 seconds
          const timer = setTimeout(() => setShowControls(false), 3000);
          return () => clearTimeout(timer);
     }, []);

     const handleMouseMove = () => {
          setShowControls(true);
          setTimeout(() => setShowControls(false), 3000);
     };

     const togglePlayPause = () => {
          if (playerRef.current) {
               if (isPlaying) {
                    playerRef.current.pause();
               } else {
                    playerRef.current.play();
               }
          }
     };

     const toggleMute = () => {
          if (playerRef.current) {
               playerRef.current.muted = !isMuted;
               setIsMuted(!isMuted);
          }
     };

     const handleVolumeChange = (e) => {
          const newVolume = e.target.value;
          setVolume(newVolume);
          if (playerRef.current) {
               playerRef.current.volume = newVolume / 100;
               if (newVolume === '0') {
                    setIsMuted(true);
                    playerRef.current.muted = true;
               } else if (isMuted) {
                    setIsMuted(false);
                    playerRef.current.muted = false;
               }
          }
     };

     const handleSeek = (e) => {
          const progressBar = e.target;
          const rect = progressBar.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          const newTime = percent * duration;

          if (playerRef.current) {
               playerRef.current.currentTime = newTime;
               setCurrentTime(newTime);
          }
     };

     const skipBackward = () => {
          if (playerRef.current) {
               playerRef.current.currentTime = Math.max(0, currentTime - 10);
          }
     };

     const skipForward = () => {
          if (playerRef.current) {
               playerRef.current.currentTime = Math.min(duration, currentTime + 10);
          }
     };

     const toggleFullscreen = () => {
          if (!document.fullscreenElement) {
               document.documentElement.requestFullscreen();
               setIsFullscreen(true);
          } else {
               document.exitFullscreen();
               setIsFullscreen(false);
          }
     };

     const handleGoBack = () => {
          navigate(-1);
     };

     const formatTime = (time) => {
          const hours = Math.floor(time / 3600);
          const minutes = Math.floor((time % 3600) / 60);
          const seconds = Math.floor(time % 60);

          if (hours > 0) {
               return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
     };

     const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

     return (
          <div className="watch-container" onMouseMove={handleMouseMove}>
               {/* Header Controls */}
               <div className={`watch-header ${showControls ? 'visible' : 'hidden'}`}>
                    <button className="back-btn" onClick={handleGoBack}>
                         <IoArrowBack />
                    </button>
                    <div className="movie-info">
                         <h1 className="movie-title">{movieData?.title}</h1>
                    </div>
               </div>

               {/* Main Video Player */}
               <div className="video-wrapper">
                    <MuxPlayer
                         ref={playerRef}
                         streamType="on-demand"
                         controls={false}  // Hide default controls
                         autoPlay={false}  // Manual autoplay
                         muted={false}     // Manual mute control
                         playsInline
                         nohotkeys
                         className="mux-player"
                         poster={movieData?.poster}
                         playbackId={localStorage.getItem('playback-id') || 'your-default-playback-id'}
                         metadataVideoTitle={movieData?.title}
                         primaryColor="#e50914"
                         onPlay={() => setIsPlaying(true)}
                         onPause={() => setIsPlaying(false)}
                         onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                         onLoadedMetadata={(e) => {
                              setDuration(e.target.duration);
                              setIsLoading(false);
                         }}
                         onWaiting={() => setIsLoading(true)}
                         onCanPlay={() => setIsLoading(false)}
                         style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              '--controls': 'none',
                              '--media-control-bar-display': 'none'
                         }}
                    />

                    {/* Custom Controls Overlay */}
                    <div className={`controls-overlay ${showControls ? 'visible' : 'hidden'}`}>
                         {/* Center Play Controls */}
                         <div className="center-controls">
                              <button className="control-btn secondary" onClick={skipBackward}>
                                   <MdReplay10 />
                              </button>
                              <button className="control-btn primary" onClick={togglePlayPause}>
                                   {isPlaying ? <IoPause /> : <IoPlay />}
                              </button>
                              <button className="control-btn secondary" onClick={skipForward}>
                                   <MdForward10 />
                              </button>
                         </div>

                         {/* Bottom Controls */}
                         <div className="bottom-controls">
                              <div className="progress-section">
                                   <div className="progress-bar" onClick={handleSeek}>
                                        <div
                                             className="progress-filled"
                                             style={{ width: `${progressPercent}%` }}
                                        >
                                             <div className="progress-thumb"></div>
                                        </div>
                                   </div>
                                   <div className="time-display">
                                        <span className="current-time">{formatTime(currentTime)}</span>
                                        <span className="separator">/</span>
                                        <span className="total-time">{formatTime(duration)}</span>
                                   </div>
                              </div>

                              <div className="control-actions">
                                   <button className="control-btn small" onClick={toggleMute}>
                                        {isMuted || volume === 0 ? <IoVolumeMute /> : <IoVolumeHigh />}
                                   </button>

                                   <div className="volume-slider">
                                        <input
                                             type="range"
                                             min="0"
                                             max="100"
                                             value={volume}
                                             onChange={handleVolumeChange}
                                        />
                                   </div>

                                   <div className="quality-selector">
                                        <select className="quality-select">
                                             <option value="auto">Auto</option>
                                             <option value="1080p">1080p</option>
                                             <option value="720p">720p</option>
                                             <option value="480p">480p</option>
                                        </select>
                                   </div>

                                   <button className="control-btn small" onClick={toggleFullscreen}>
                                        {isFullscreen ? <IoContract /> : <IoExpand />}
                                   </button>
                              </div>
                         </div>
                    </div>

                    {/* Loading Spinner */}
                    <div className={`loading-spinner ${isLoading ? 'visible' : ''}`}>
                         <div className="spinner"></div>
                    </div>
               </div>
          </div>
     );
}

export default Watch