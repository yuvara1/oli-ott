import React, { createContext, useContext, useState } from 'react';

const MovieContext = createContext();

export function MovieProvider({ children }) {
     const [trailers, setTrailers] = useState([]);
     const [loading, setLoading] = useState(true);

     return (
          <MovieContext.Provider value={{ trailers, setTrailers, loading, setLoading }}>
               {children}
          </MovieContext.Provider>
     );
}

export function useMovieContext() {
     return useContext(MovieContext);
}