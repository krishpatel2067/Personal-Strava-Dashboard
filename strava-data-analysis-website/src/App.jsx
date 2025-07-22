import { useEffect, useState } from 'react';
import './App.css'
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';

const firebaseConfig = {
  
};

const app = initializeApp(firebaseConfig);

function App() {

  useEffect(() => {
    const fetchAnalysis = () => {
      const storage = getStorage(app);
      const analysisRef = ref(storage, "public/analysis.json");

      getDownloadURL(analysisRef)
        .then(async url => {
          const res = await fetch(url);
          const json = await res.json();
          console.log(json);
        })
        .catch(err => {
          console.log("Error while fetching analysis.json:", err.message);
        });
    }
    fetchAnalysis();
  }, []);

  return (
    <div className="App">

    </div>
  )
}

export default App
