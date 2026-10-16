import './shim';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import Conclusion from './Conclusion';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Conclusion />
  </StrictMode>,
);
