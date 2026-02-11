import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { 
  PlusCircle, Trash2, TrendingUp, Activity, FileText, LayoutDashboard, Table, AlertTriangle, CheckCircle, Upload, Clipboard, RefreshCw, Briefcase, DollarSign, Maximize2, X, Download
} from 'lucide-react';

// --- Componentes UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const KpiCard = ({ title, value, subtext, icon: Icon, colorClass, borderClass }) => (
  <Card className={`p-6 border-l-4 ${borderClass} flex items-center justify-between hover:shadow-md transition-shadow`}>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </Card>
);

// --- Función de descarga de gráfico ---
const downloadChartAsPng = (elementId, fileName) => {
  const svgElement = document.querySelector(`#${elementId} svg`);
  if (!svgElement) {
    alert("No se encontró el gráfico para descargar.");
    return;
  }

  // Serializar el SVG
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  
  // Crear un canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  // Obtener dimensiones reales del SVG para el canvas
  const svgRect = svgElement.getBoundingClientRect();
  canvas.width = svgRect.width + 40; // Margen extra
  canvas.height = svgRect.height + 40;

  // Fondo blanco para que no sea transparente
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    // Dibujar imagen centrada con un poco de margen
    ctx.drawImage(img, 20, 20);
    const pngUrl = canvas.toDataURL("image/png");
    
    // Crear link de descarga
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${fileName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  img.src = url;
};

// --- Componente Modal para "Ver Todo" con Descarga ---
const FullScreenModal = ({ isOpen, onClose, title, children, contentId }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Activity className="mr-2 text-blue-600" size={24}/>
            {title}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => downloadChartAsPng(contentId, title.replace(/\s+/g, '_'))}
              className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
              title="Descargar Gráfico como PNG"
            >
              <Download size={18} className="mr-2"/> Descargar PNG
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50" id={contentId}>
          <div className="bg-white p-4 rounded-lg shadow-sm">
             {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Renderizado de Etiquetas Personalizadas para Pie Chart ---
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
  const RADIAN = Math.PI / 180;
  // Aumentar radio para empujar texto hacia afuera
  const radius = outerRadius + 30; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? 'start' : 'end';

  // Formato moneda
  const formattedValue = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  return (
    <text x={x} y={y} fill="#334155" textAnchor={textAnchor} dominantBaseline="central" fontSize="11" fontWeight="bold">
      {`${name}: ${formattedValue} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

// --- COLORES CORPORATIVOS ---
const COLORS = {
  API: '#1e3a8a',    // Azul Marino (Inversión)
  OPEX: '#64748b',   // Gris Pizarra (Gasto)
  PREV: '#10b981',   // Esmeralda (Preventivo)
  CORR: '#ef4444',   // Rojo (Correctivo)
  IMP: '#f59e0b',    // Ambar (Mejora)
  BARS: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'] // Escala de azules
};

// --- DATOS INICIALES COMPLETOS ---
const initialData = [
  { id: 1, actividad: "INSTALACIÓN DE BOMBA DE VACIO DE CHILE", monto: 100000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 2, actividad: "LUCERNALIAS DE TECHO DE MP1 CON CORROSIÓN", monto: 83454.14, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 3, actividad: "TPM--SERV.VOITH CAJA DE ENTRADA MP1", monto: 62000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 4, actividad: "MTTO SUB ESTACIONES", monto: 56210.00, concepto: "API", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 5, actividad: "REDUCTORES (Pulper + otros)", monto: 54000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 6, actividad: "MTTO 1A REDUCTOR PULPER PP1", monto: 50000.00, concepto: "API", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 7, actividad: "TANQUES AIRE - VAPOR", monto: 31788.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 8, actividad: "MTTO 1A CALDERA 5", monto: 30000.00, concepto: "API", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 9, actividad: "TRABAJOS VARIOS EN INSTRUMENTACIÓN", monto: 27300.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 10, actividad: "MTTO 2A POZO AGUA N°05", monto: 16326.30, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 11, actividad: "REPARACIÓN DE TECHO MP1 LADO MEZANINE", monto: 15000.00, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 12, actividad: "MTTO 1A CILINDRO YANKEE MP1", monto: 14000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 13, actividad: "TPM INST. MEDIDOR DE FLUJO DE GAS", monto: 14000.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "MEJORA" },
  { id: 14, actividad: "MTTO 1A RODILLO SUCCION", monto: 12000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 15, actividad: "TPM-CAMBIO DE TUBERIA CONDUIT TECHO MP", monto: 10500.00, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 16, actividad: "MTTO CAPOTA", monto: 7000.00, concepto: "API", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 17, actividad: "CAMBIO DE GRASAS Y LUBRICANTES", monto: 7000.00, concepto: "OPEX", responsable: "PREDICTIVO", tipo: "PREVENTIVO" },
  { id: 18, actividad: "TPM F SERVER SIEMENS EST. CONTROL 1", monto: 6000.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "CORRECTIVO" },
  { id: 19, actividad: "CAMBIO DE ROTOR Y CRIBA DE LA PERA", monto: 5000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 20, actividad: "MANTENIMIENTO VALVULAS", monto: 5000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 21, actividad: "MANTENIMIENTO CARDANES", monto: 4000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 22, actividad: "TPM R CORROSION DE ESTRUCTURA 120RTU151", monto: 4000.00, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 23, actividad: "TPM R CORROSION DE ESTRUCTURA 120RTU152", monto: 4000.00, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 24, actividad: "MTTO 2A PREVENTIVO RED AEREA 22.9KV", monto: 3000.00, concepto: "API", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 25, actividad: "MTTO 3M DAMPER CAPOTA MP1", monto: 3000.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 26, actividad: "LAVADO QUIMICO BOMBAS VACIO", monto: 3000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 27, actividad: "MANTTO SEMESTRAL SISTEMA PESAJE PULPER", monto: 3000.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 28, actividad: "MTTO CORRECTIVO 1A DRIVE DR100", monto: 2500.00, concepto: "OPEX", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 29, actividad: "MTTO CORRECTIVO 1A DRIVE DR200", monto: 2500.00, concepto: "OPEX", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 30, actividad: "MTTO 1A MCC1 MP1", monto: 2500.00, concepto: "API", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 31, actividad: "MTTO 1A MCC2 MP1", monto: 2500.00, concepto: "API", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 32, actividad: "CAMBIO DE ENCHAQUETADO ZONA DE MESANINE", monto: 2500.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 33, actividad: "PRUEBAS ELECTRICAS CABLES DE MEDIA TENSIÓN", monto: 2000.00, concepto: "API", responsable: "ELECTRICO", tipo: "CORRECTIVO" },
  { id: 34, actividad: "TPM-FALLA MOTOR PERDIDA DE AISLAMIENTO", monto: 2000.00, concepto: "OPEX", responsable: "ELECTRICO", tipo: "CORRECTIVO" },
  { id: 35, actividad: "MTTO 6M EXTRACTOR VAHO VE-95 MP1", monto: 2000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 36, actividad: "CAMBIO CHUMACERAS HVAC", monto: 2000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 37, actividad: "TPM CALIB MEDIDOR SALIDA VAPOR FIT X4310", monto: 2000.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 38, actividad: "TPM CALIB. MEDIDOR FLUJO DE VAPOR FT 516", monto: 2000.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 39, actividad: "TPM-CAMBIO DE PLANCHA TRANSP. DE FARDOS", monto: 1800.00, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 40, actividad: "MTTO 1A VENTILADORES", monto: 1500.00, concepto: "OPEX", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 41, actividad: "TPM-FALTA GUARDA TORNILLO DE RECHAZO", monto: 1500.00, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 42, actividad: "MANTTO PREVENTIVO PISTONES NEUMATICO", monto: 1500.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 43, actividad: "TPM. MIGRACION SIST. DE CONTROL", monto: 1300.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "CORRECTIVO" },
  { id: 44, actividad: "CAMBIO DE RECUBRIMIENTO DE RODILLOS - CAVAL", monto: 1000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 45, actividad: "MTTO 5A TANQUE FLASH PTER", monto: 1000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 46, actividad: "MTTO 1A ENSAYOS END QUEMADOR 120-VE-01", monto: 1000.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 47, actividad: "TPM-AVERIA LAMPARA DE SEÑALIZACION CCM", monto: 500.00, concepto: "OPEX", responsable: "ELECTRICO", tipo: "CORRECTIVO" },
  { id: 48, actividad: "TPM-A-PRED_DESALINEAMIENT_EJE_120BV30 (PRED - INFR)", monto: 500.00, concepto: "OPEX", responsable: "PREDICTIVO", tipo: "CORRECTIVO" },
  { id: 49, actividad: "P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV31 (PRED - INFR)", monto: 500.00, concepto: "OPEX", responsable: "PREDICTIVO", tipo: "CORRECTIVO" },
  { id: 50, actividad: "P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV32 (PRED - INFR)", monto: 500.00, concepto: "OPEX", responsable: "PREDICTIVO", tipo: "CORRECTIVO" },
  { id: 51, actividad: "F TPMR-TANQUE-ROMPE-PURGA-LINEA-PICADURA", monto: 500.00, concepto: "OPEX", responsable: "INFRAESTRUCTURA", tipo: "CORRECTIVO" },
  { id: 52, actividad: "MANTTO MENSUAL DE SENSORES", monto: 500.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 53, actividad: "MANTENIMIENTO PREVENTIVO PISTON NEUMATIC", monto: 500.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 54, actividad: "CAMB 4A REPETID PROFI TABL 120ABC21ES22", monto: 500.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 55, actividad: "CAMB 4A REPETID PROFI TABL 120ABC11ES11", monto: 500.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 56, actividad: "LIMP QUIMICA TUBOS AGUA (PASIVADO)", monto: 500.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 57, actividad: "MANTTO SEMESTRAL TABLEROS NEUMATICOS PP1", monto: 200.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 58, actividad: "MTTO 6M REGADERA RODILLO SUCCION", monto: 200.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 59, actividad: "MTTO 2A BUZONES MT 22.9KV", monto: 100.00, concepto: "OPEX", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 60, actividad: "MTTO 2M PALPADORES PRENSA LODOS 1", monto: 100.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 61, actividad: "MTTO 2M PALPADORES PRENSA LODOS 2", monto: 100.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 62, actividad: "MTTO TRAFOS", monto: 0.00, concepto: "API", responsable: "ELECTRICO", tipo: "PREVENTIVO" },
  { id: 63, actividad: "RODILLERIA", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 64, actividad: "MTTO 2A CILIND HIDRAU LEVANT L.A NIPCOFL (INSPECCION)", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 65, actividad: "TPM-A-PRED_DESGASTE_RODA_CHU_DIABOLO", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 66, actividad: "MTTO 1A DAF PTAR", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 67, actividad: "MTTO 2M/1A CHORRO PASA PUNTA MP1", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 68, actividad: "MTTO 1M CHILLING SHOWER MP1", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 69, actividad: "MTTO 3M SISTEMA MECANICO QCS MP1", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 70, actividad: "MTTO 4M SVECOM MP1", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 71, actividad: "MTTO 4M MECA ENFAJILLADORA MP1", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 72, actividad: "MONTAJE DE ACOPLE DE BOMBA DE VACIO 32", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 73, actividad: "P TPM-A-PRED AGITADOR 120-AG-11B", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 74, actividad: "INSPECCION IMPULSOR FAM PUM", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "PREVENTIVO" },
  { id: 75, actividad: "TPM-MTTO CORREC  CALIB. VV REGULADORA GN", monto: 0.00, concepto: "OPEX", responsable: "MECANICO", tipo: "CORRECTIVO" },
  { id: 76, actividad: "ALINEAMIENTO DE RODILLO SUCCIÓN", monto: 0.00, concepto: "OPEX", responsable: "PREDICTIVO", tipo: "CORRECTIVO" },
  { id: 77, actividad: "MANTTO ROTAMETRO DEL ABLANDADOR", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 78, actividad: "MANTTO SIST TANQUE CONDENSADO CALDERA", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 79, actividad: "MANTTO 6M VALVULA CONTROL", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 80, actividad: "MANTTO MENSUAL DE SENSORES", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 81, actividad: "MANTTO MENSUAL DE SENSORES", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 82, actividad: "MANTTO SISTEMA COMBUSTIBLE Y QUEMADOR", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 83, actividad: "MTTO 6M VALVULAS ON/OFF REGADERA TELA", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "PREVENTIVO" },
  { id: 84, actividad: "PRUEBAS DE INTERLOCK", monto: 0.00, concepto: "OPEX", responsable: "INSTRUMENTACIÓN", tipo: "CORRECTIVO" }
];

export default function MaintenanceDashboard() {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState('dashboard');
  const [pasteData, setPasteData] = useState('');
  const [modalOpen, setModalOpen] = useState(null); // 'API', 'OPEX', 'RESP'
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    actividad: '',
    monto: '',
    concepto: 'OPEX',
    responsable: '',
    tipo: 'PREVENTIVO'
  });

  // --- Cargar Librería XLSX ---
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.async = true;
      document.body.appendChild(script);
      return () => { try { document.body.removeChild(script); } catch (e) {} }
    }
  }, []);

  // --- Helpers ---
  const determineTipo = (val) => {
    const str = String(val || '').toUpperCase().trim();
    if (!str) return '';
    if (str.includes('PREVENTIVO')) return 'PREVENTIVO';
    if (str.includes('CORRECTIVO')) return 'CORRECTIVO';
    if (str.includes('MEJORA')) return 'MEJORA';
    return ''; 
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  // --- Lógica de Negocio ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddData = (e) => {
    e.preventDefault();
    if (!formData.actividad || !formData.monto) return;
    const newItem = {
      id: Date.now(),
      actividad: formData.actividad,
      monto: parseFloat(formData.monto),
      concepto: formData.concepto.toUpperCase(),
      responsable: formData.responsable.toUpperCase(),
      tipo: formData.tipo.toUpperCase()
    };
    setData(prev => [...prev, newItem]);
    setFormData({ actividad: '', monto: '', concepto: 'OPEX', responsable: '', tipo: 'PREVENTIVO' });
  };

  const handleDelete = (id) => setData(prev => prev.filter(item => item.id !== id));
  const handleClearAll = () => { if (window.confirm("¿Estás seguro de que quieres eliminar TODOS los datos?")) setData([]); };

  // --- LÓGICA COPY-PASTE ---
  const handlePasteProcess = () => {
    if (!pasteData.trim()) return;
    const rows = pasteData.trim().split('\n');
    const newItems = [];
    let successCount = 0;

    rows.forEach((row, index) => {
        let cols = row.split('\t');
        let isHyphen = false;
        if (cols.length < 2) { cols = row.split('-'); isHyphen = true; }
        if (cols.length < 2) return; 

        let actividad, montoStr, concepto, responsable, tipoStr;
        if (isHyphen && cols.length > 5) {
            const lastIdx = cols.length - 1;
            tipoStr = cols[lastIdx];
            responsable = cols[lastIdx - 1];
            concepto = cols[lastIdx - 2];
            montoStr = cols[lastIdx - 3];
            actividad = cols.slice(0, lastIdx - 3).join('-');
        } else {
            actividad = cols[0];
            montoStr = cols[1];
            concepto = cols[2];
            responsable = cols[3];
            tipoStr = cols[4];
        }

        actividad = actividad?.trim();
        const cleanMontoStr = montoStr?.trim().replace(/[^0-9.-]/g, ''); 
        const monto = parseFloat(cleanMontoStr) || 0;
        concepto = concepto?.trim().toUpperCase() || 'OPEX';
        responsable = responsable?.trim().toUpperCase() || 'GENERAL';
        const tipo = determineTipo(tipoStr);

        if (actividad && (monto >= 0 || monto < 0)) {
            newItems.push({ id: `PASTE-${Date.now()}-${index}`, actividad, monto, concepto, responsable, tipo });
            successCount++;
        }
    });

    if (newItems.length > 0) {
        setData(prev => [...prev, ...newItems]);
        setPasteData('');
        alert(`¡Importación exitosa! Se añadieron ${successCount} registros.`);
    } else {
        alert("No se pudieron leer los datos. Verifica el formato.");
    }
  };

  // --- Lógica Importación Archivo ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      if (window.XLSX) {
        try {
          const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          processDataRows(jsonData);
        } catch (error) { alert("Error al leer Excel."); }
      } else {
        const dec = new TextDecoder("utf-8");
        const text = dec.decode(arrayBuffer);
        const rows = text.split('\n').map(line => line.split(','));
        processDataRows(rows);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processDataRows = (rows) => {
    const newItems = [];
    rows.forEach((cols, index) => {
      if (!cols || cols.length < 2) return;
      const getVal = (val) => {
        if (val === null || val === undefined) return '';
        return String(val).trim().replace(/"/g, '');
      };
      const cleanMonto = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(String(val).replace(/[$,"]/g, '').replace(/,/g, '')) || 0;
      };

      const actLeft = getVal(cols[1]);
      const montLeft = cleanMonto(cols[2]);
      if (actLeft && actLeft !== "ACTIVIDAD" && montLeft >= 0) {
        newItems.push({
          id: `L-${index}`, actividad: actLeft, monto: montLeft, concepto: getVal(cols[3]) || "OPEX", responsable: getVal(cols[4]) || "GENERAL", tipo: determineTipo(cols[5]) 
        });
      }
      const actRight = getVal(cols[9]);
      const montRight = cleanMonto(cols[10]);
      if (actRight && actRight !== "ACTIVIDAD" && montRight >= 0) {
         newItems.push({
          id: `R-${index}`, actividad: actRight, monto: montRight, concepto: getVal(cols[11]) || "API", responsable: getVal(cols[12]) || "GENERAL", tipo: determineTipo(cols[13]) 
        });
      }
    });
    if (newItems.length > 0) {
      setData(newItems);
      alert(`¡Éxito! Se cargaron ${newItems.length} registros.`);
    } else {
      alert("No se encontraron datos válidos.");
    }
  };

  // --- CÁLCULOS ---
  const metrics = useMemo(() => {
    const totalGasto = data.reduce((acc, item) => acc + item.monto, 0);
    const byConcepto = data.reduce((acc, item) => {
      const key = item.concepto || "OTROS";
      acc[key] = (acc[key] || 0) + item.monto;
      return acc;
    }, {});
    const chartDataConcepto = Object.keys(byConcepto).map(key => ({ name: key, value: byConcepto[key] }));

    const byTipo = data.reduce((acc, item) => {
      const key = item.tipo || "SIN CLASIFICAR"; 
      acc[key] = (acc[key] || 0) + item.monto;
      return acc;
    }, {});
    const chartDataTipo = Object.keys(byTipo).map(key => ({ name: key, value: byTipo[key] }));

    const byResponsable = data.reduce((acc, item) => {
      const key = item.responsable || "SIN ASIGNAR";
      acc[key] = (acc[key] || 0) + item.monto;
      return acc;
    }, {});
    const chartDataResponsable = Object.keys(byResponsable)
      .map(key => ({ name: key, monto: byResponsable[key] }))
      .sort((a, b) => b.monto - a.monto);

    const sortedApi = data.filter(d => d.concepto === 'API').sort((a,b) => b.monto - a.monto);
    const sortedOpex = data.filter(d => d.concepto === 'OPEX').sort((a,b) => b.monto - a.monto);

    return { totalGasto, chartDataConcepto, chartDataTipo, chartDataResponsable, byConcepto, sortedApi, sortedOpex };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="text-emerald-400" />
            <span className="text-lg font-semibold tracking-wide text-slate-100">DASHBOARD</span>
          </div>
          <nav className="flex space-x-2">
            <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>Dashboard</button>
            <button onClick={() => setView('entry')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${view === 'entry' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>Gestión</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Resumen Financiero</h2>
                <p className="text-slate-500 text-sm mt-1">Visión consolidada de Inversiones (API) y Gastos Operativos (OPEX)</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Gasto Total Ejecutado</span>
                <div className="text-4xl font-extrabold text-slate-900">{formatCurrency(metrics.totalGasto)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard title="TOTAL API (INVERSIÓN)" value={formatCurrency(metrics.byConcepto['API'] || 0)} subtext="" icon={TrendingUp} colorClass="bg-blue-600" borderClass="border-blue-600" />
              <KpiCard title="TOTAL OPEX (OPERATIVO)" value={formatCurrency(metrics.byConcepto['OPEX'] || 0)} subtext="" icon={DollarSign} colorClass="bg-slate-500" borderClass="border-slate-500" />
              <KpiCard title="EFICIENCIA PREVENTIVA" value={`${((metrics.chartDataTipo.find(c => c.name === 'PREVENTIVO')?.value || 0) / (metrics.totalGasto || 1) * 100).toFixed(1)}%`} subtext="% del Presupuesto en Prevención" icon={CheckCircle} colorClass="bg-emerald-500" borderClass="border-emerald-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Distribución API vs OPEX con etiquetas externas */}
              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-6 flex items-center"><span className="w-1 h-4 bg-blue-800 mr-2"></span>Distribución (API vs OPEX)</h3>
                {data.length > 0 ? (
                  <div className="h-80 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={metrics.chartDataConcepto} 
                          cx="50%" cy="50%" 
                          innerRadius={60} 
                          outerRadius={90} 
                          paddingAngle={2} 
                          dataKey="value"
                          label={renderCustomizedLabel} // Usar etiqueta personalizada
                          labelLine={true}
                        >
                          {metrics.chartDataConcepto.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.name === 'API' ? COLORS.API : entry.name === 'OPEX' ? COLORS.OPEX : COLORS.IMP} />))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius:'8px'}} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400">Sin datos</div>}
              </Card>

              {/* Gráfico 2: Eficiencia con etiquetas externas */}
              <Card className="p-6">
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-6 flex items-center"><span className="w-1 h-4 bg-emerald-600 mr-2"></span>Eficiencia (Tipo de OM)</h3>
                {data.length > 0 ? (
                  <div className="h-80 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={metrics.chartDataTipo} 
                          cx="50%" cy="50%" 
                          innerRadius={60} 
                          outerRadius={90} 
                          paddingAngle={2} 
                          dataKey="value"
                          label={renderCustomizedLabel} // Usar etiqueta personalizada
                          labelLine={true}
                        >
                          {metrics.chartDataTipo.map((entry, index) => {
                            let color = '#cbd5e1'; 
                            if (entry.name === 'PREVENTIVO') color = COLORS.PREV;
                            if (entry.name === 'CORRECTIVO') color = COLORS.CORR;
                            if (entry.name === 'MEJORA') color = COLORS.IMP;
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius:'8px'}} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400">Sin datos</div>}
              </Card>
            </div>

            {/* GRÁFICOS DETALLADOS CON BOTÓN DE EXPANDIR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               
               {/* Detalle API */}
               <Card className="p-6 h-[500px] flex flex-col relative">
                 <button onClick={() => setModalOpen('API')} className="absolute top-4 right-4 text-slate-400 hover:text-blue-600 transition-colors p-2 rounded hover:bg-blue-50" title="Ver hoja completa">
                    <Maximize2 size={20} />
                 </button>
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-blue-800 mr-2"></span>Detalle API</h3>
                 <div className="flex-1 overflow-y-auto pr-2">
                    {metrics.sortedApi.length > 0 ? (
                        <div style={{ height: Math.max(400, metrics.sortedApi.length * 50) }}>
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.sortedApi} layout="vertical" margin={{top:5, right:60, left:20, bottom:5}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                                <XAxis type="number" hide />
                                <YAxis dataKey="actividad" type="category" width={140} tick={{fontSize:10, fill:'#475569'}} />
                                <RechartsTooltip cursor={{fill: '#eff6ff'}} formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="monto" fill={COLORS.API} radius={[0, 4, 4, 0]} barSize={20}>
                                    <LabelList dataKey="monto" position="right" formatter={(val) => formatCurrency(val)} style={{ fontSize: '10px', fill: '#1e3a8a', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                 </div>
               </Card>

               {/* Detalle OPEX */}
               <Card className="p-6 h-[500px] flex flex-col relative">
                 <button onClick={() => setModalOpen('OPEX')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded hover:bg-slate-100" title="Ver hoja completa">
                    <Maximize2 size={20} />
                 </button>
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-slate-500 mr-2"></span>Detalle OPEX</h3>
                 <div className="flex-1 overflow-y-auto pr-2">
                    {metrics.sortedOpex.length > 0 ? (
                        <div style={{ height: Math.max(400, metrics.sortedOpex.length * 50) }}>
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.sortedOpex} layout="vertical" margin={{top:5, right:60, left:20, bottom:5}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                                <XAxis type="number" hide />
                                <YAxis dataKey="actividad" type="category" width={140} tick={{fontSize:10, fill:'#475569'}} />
                                <RechartsTooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="monto" fill={COLORS.OPEX} radius={[0, 4, 4, 0]} barSize={20}>
                                    <LabelList dataKey="monto" position="right" formatter={(val) => formatCurrency(val)} style={{ fontSize: '10px', fill: '#475569', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                 </div>
               </Card>
            </div>

            {/* GASTO TOTAL POR RESPONSABLE */}
            <Card className="p-6 relative">
              <button onClick={() => setModalOpen('RESP')} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded hover:bg-indigo-50" title="Ver hoja completa">
                 <Maximize2 size={20} />
              </button>
              <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-indigo-600 mr-2"></span>Gasto por Puesto</h3>
              {data.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.chartDataResponsable} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                      <YAxis tickFormatter={(val)=> `$${val/1000}k`} tick={{fontSize: 12, fill: '#64748b'}} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius:'8px'}} />
                      <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="monto" position="top" formatter={(value) => formatCurrency(value)} style={{ fontSize: '11px', fill: '#475569', fontWeight: 'bold' }} />
                        {metrics.chartDataResponsable.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS.BARS[index % COLORS.BARS.length]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="h-80 flex items-center justify-center text-slate-400">Sin datos</div>}
            </Card>

             {/* MODALES PARA VISTA COMPLETA (Con botón de descarga) */}
             <FullScreenModal 
                isOpen={modalOpen === 'API'} 
                onClose={() => setModalOpen(null)} 
                title="Desglose Completo: Inversiones (API)"
                contentId="modal-chart-api"
             >
                <div style={{ height: Math.max(600, metrics.sortedApi.length * 40) }} id="modal-chart-api">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.sortedApi} layout="vertical" margin={{top:20, right:100, left:20, bottom:20}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                          <XAxis type="number" hide />
                          <YAxis dataKey="actividad" type="category" width={300} tick={{fontSize:12, fill:'#1e293b'}} />
                          <RechartsTooltip cursor={{fill: '#eff6ff'}} formatter={(value) => formatCurrency(value)} />
                          <Bar dataKey="monto" fill={COLORS.API} radius={[0, 4, 4, 0]} barSize={25}>
                              <LabelList dataKey="monto" position="right" formatter={(val) => formatCurrency(val)} style={{ fontSize: '12px', fill: '#1e3a8a', fontWeight: 'bold' }} />
                          </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </FullScreenModal>

             <FullScreenModal 
                isOpen={modalOpen === 'OPEX'} 
                onClose={() => setModalOpen(null)} 
                title="Desglose Completo: Gastos Operativos (OPEX)"
                contentId="modal-chart-opex"
             >
                <div style={{ height: Math.max(600, metrics.sortedOpex.length * 40) }} id="modal-chart-opex">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.sortedOpex} layout="vertical" margin={{top:20, right:100, left:20, bottom:20}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                          <XAxis type="number" hide />
                          <YAxis dataKey="actividad" type="category" width={300} tick={{fontSize:12, fill:'#1e293b'}} />
                          <RechartsTooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => formatCurrency(value)} />
                          <Bar dataKey="monto" fill={COLORS.OPEX} radius={[0, 4, 4, 0]} barSize={25}>
                              <LabelList dataKey="monto" position="right" formatter={(val) => formatCurrency(val)} style={{ fontSize: '12px', fill: '#475569', fontWeight: 'bold' }} />
                          </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </FullScreenModal>

             <FullScreenModal 
                isOpen={modalOpen === 'RESP'} 
                onClose={() => setModalOpen(null)} 
                title="Vista Completa: Gasto por Responsable"
                contentId="modal-chart-resp"
             >
                <div className="h-[600px]" id="modal-chart-resp">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataResponsable} margin={{ top: 40, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 14, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tickFormatter={(val)=> formatCurrency(val)} tick={{fontSize: 12, fill: '#64748b'}} width={100}/>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius:'8px'}} />
                        <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="monto" position="top" formatter={(value) => formatCurrency(value)} style={{ fontSize: '14px', fill: '#475569', fontWeight: 'bold' }} />
                          {metrics.chartDataResponsable.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS.BARS[index % COLORS.BARS.length]} />))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </FullScreenModal>

          </div>
        )}

        {view === 'entry' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-500">
            {/* ... Resto del componente de entrada ... */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 bg-blue-50 border-blue-200">
                 <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center uppercase">
                  <Clipboard className="mr-2 text-blue-600" size={18}/> Pegar Datos Masivos
                </h3>
                <p className="text-xs text-blue-700 mb-3">
                  Copia de Excel y pega aquí. Formato: <br/><b>Actividad - Monto - Concepto - Responsable - Tipo</b>
                </p>
                <textarea 
                  rows={4}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  className="w-full text-xs p-3 rounded border border-blue-200 focus:ring-2 focus:ring-blue-400 mb-3"
                  placeholder="Ej: MTTO MOTOR - $2,500.00 - OPEX - ELECTRICO - PREVENTIVO"
                />
                <button type="button" onClick={handlePasteProcess} className="w-full py-2 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-800 transition shadow-sm">
                    Procesar Datos
                </button>
              </Card>

              <Card className="p-6 border-t-4 border-emerald-500">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center uppercase">
                  <PlusCircle className="mr-2 text-emerald-500" size={18}/> Registro Manual
                </h3>
                <form onSubmit={handleAddData} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Actividad</label>
                    <textarea required rows={2} name="actividad" value={formData.actividad} onChange={handleInputChange} className="w-full rounded border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2 text-sm border" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Monto</label>
                    <input required type="number" name="monto" value={formData.monto} onChange={handleInputChange} className="w-full rounded border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2 text-sm border" placeholder="0.00" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Concepto</label>
                      <select name="concepto" value={formData.concepto} onChange={handleInputChange} className="w-full rounded border-slate-300 p-2 text-sm border">
                        <option value="OPEX">OPEX</option>
                        <option value="API">API</option>
                        <option value="CAPEX">CAPEX</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo OM</label>
                      <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full rounded border-slate-300 p-2 text-sm border">
                        <option value="PREVENTIVO">PREVENTIVO</option>
                        <option value="CORRECTIVO">CORRECTIVO</option>
                        <option value="MEJORA">MEJORA</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Responsable</label>
                    <input name="responsable" value={formData.responsable} onChange={handleInputChange} className="w-full rounded border-slate-300 p-2 text-sm border" />
                  </div>
                  <button type="submit" className="w-full flex justify-center py-2 px-4 rounded shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors">
                    Agregar Registro
                  </button>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
                   <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Base de Datos ({data.length} registros)</h3>
                   <div className="flex items-center space-x-3">
                      <button onClick={handleClearAll} className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded hover:bg-red-50" title="Limpiar todo">
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
                <div className="overflow-x-auto flex-1 p-0">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-white text-xs uppercase font-semibold text-slate-400 sticky top-0 z-10 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Actividad</th>
                        <th className="px-6 py-3 text-right">Monto</th>
                        <th className="px-6 py-3 text-center">Concepto</th>
                        <th className="px-6 py-3">Responsable</th>
                        <th className="px-6 py-3 text-center">Tipo</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-2 font-medium text-slate-900 max-w-xs truncate">{item.actividad}</td>
                          <td className="px-6 py-2 text-right font-mono text-slate-600">{formatCurrency(item.monto)}</td>
                          <td className="px-6 py-2 text-center"><span className="text-xs font-bold text-slate-500">{item.concepto}</span></td>
                          <td className="px-6 py-2 text-xs">{item.responsable}</td>
                          <td className="px-6 py-2 text-center text-xs">{item.tipo}</td>
                          <td className="px-6 py-2 text-center">
                            <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {data.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                            <div className="flex flex-col items-center">
                               <RefreshCw className="mb-2 text-gray-300" size={24}/>
                               Base de datos vacía.<br/>Usa el panel izquierdo para importar o pegar datos.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}