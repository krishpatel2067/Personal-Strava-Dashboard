import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';

import { fetchAndProcessAnalysis } from "./fetch";

import Dashboard from './components/sections/Dashboard';
import About from './components/sections/About';
import Header from './components/sections/Header';
import Footer from './components/sections/Footer';
import './App.css'

// TODO: style text and date inputs; make tooltip render over graph tooltip; add tip to interact with graphs
// TODO: add shoes
// TODO: improve styles (perhaps custom drop downs!)

const app = initializeApp({
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
  measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID,
});

function App() {
  const [loaded, setLoaded] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [data, setData] = useState({});

  useEffect(() => {
    (async () => {
      const { data, metadata } = await fetchAndProcessAnalysis(app);
      setData(data);
      setMetadata(metadata);
      setLoaded(true);
    })();
  }, []);

  // equalize the time zone offset then convert to locale date string for localization without auto-adjusting dates by time zone

  return (
    <div className="App">
      <Header />
      <Dashboard data={data} loaded={loaded} />
      <About />
      <Footer metadata={metadata} loaded={loaded} />
    </div>
  );
}

export default App
