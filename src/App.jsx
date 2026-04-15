import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell,
  PieChart, Pie, AreaChart, Area, Legend
} from 'recharts';
import { 
  PlusCircle, Trash2, Activity, LayoutDashboard, Table, Clipboard, Maximize2, X, Download, Calendar, ChevronLeft, ChevronRight, ChevronDown, Pencil, Maximize, Minimize, Briefcase, Clock, Layers, Flame
} from 'lucide-react';

// --- Componentes UI Atómicos ---

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

// --- Funciones de Utilidad ---

const downloadChartAsPng = (elementId, fileName) => {
  const svgElement = document.querySelector(`#${elementId} svg`);
  if (!svgElement) return;
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const svgRect = svgElement.getBoundingClientRect();
  canvas.width = svgRect.width + 40; 
  canvas.height = svgRect.height + 40;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    ctx.drawImage(img, 20, 20);
    const pngUrl = canvas.toDataURL("image/png");
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

const FullScreenModal = ({ isOpen, onClose, title, children, contentId }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Activity className="mr-2 text-indigo-600" size={24}/>
            {title}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => downloadChartAsPng(contentId, title.replace(/\s+/g, '_'))}
              className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
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

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <text x={x} y={y} fill="#334155" textAnchor={textAnchor} dominantBaseline="central" fontSize="11" fontWeight="bold">
      {`${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

// --- Colores Consistentes ---
const RESPONSABLE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', 
  '#06b6d4', '#f97316', '#14b8a6', '#ec4899', '#6366f1'
];

const getResponsableColor = (name, uniqueList) => {
  const idx = uniqueList.indexOf(name);
  if (idx === -1) return '#94a3b8';
  return RESPONSABLE_COLORS[idx % RESPONSABLE_COLORS.length];
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const parseDate = (dStr) => {
    if (!dStr) return '';
    const match = String(dStr).trim().match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    const match2 = String(dStr).trim().match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match2) return match2[0];
    return '';
};

// --- Parseador Universal (5 bloques) ---
const parseFormattedLine = (line) => {
    let parts = line.split('\t');
    if (parts.length < 5) parts = line.split(' - ');
    if (parts.length < 5) return null;

    const len = parts.length;
    const fechaFinStr = parts[len - 1].trim();
    const detalleStr = parts[len - 2].trim();
    const fechaInicioStr = parts[len - 3].trim();
    const responsable = parts[len - 4].trim().toUpperCase();
    const actividad = parts.slice(0, len - 4).join(' - ').trim(); 

    const parsedFechaI = parseDate(fechaInicioStr);
    const parsedFechaF = parseDate(fechaFinStr);

    const cronograma = {};
    const days = detalleStr.split('|');
    days.forEach(dayStr => {
        const dateMatch = dayStr.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
        if(dateMatch) {
            const parsedD = parseDate(dateMatch[1]);
            const shiftsMatch = dayStr.match(/\[(.*?)\]/);
            if(shiftsMatch && parsedD) {
                const shifts = shiftsMatch[1].split(',').map(s => s.trim().toUpperCase()).filter(s => s.match(/T[1-3]/));
                cronograma[parsedD] = shifts;
            }
        }
    });

    return { actividad, responsable, fechaInicio: parsedFechaI, fechaFin: parsedFechaF, cronograma };
};

// --- Base de Datos Interna Inicial (Formato Nuevo 5 bloques) ---
const rawDatabase = `MTTO  SUB ESTACIONES - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
MTTO TRAFOS - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
MTTO 2A PREVENTIVO RED AEREA 22.9KV - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
MTTO CORRECTIVO 1A DRIVE DR100 - ELECTRICO - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2, T3] - 23/06/2026
MTTO CORRECTIVO 1A DRIVE DR200 - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
MTTO 1A MCC1 MP1 - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
MTTO 1A MCC2 MP1 - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
MTTO 1A VENTILADORES - ELECTRICO - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2] - 23/06/2026
MTTO 2A BUZONES MT 22.9KV - ELECTRICO - 24/06/2026 - 24/06/2026 [T1, T2] - 24/06/2026
PRUEBAS ELECTRICAS CABLES DE MEDIA TENSIÓN - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
TPM-AVERIA LAMPARA DE SEÑALIZACION CCM - ELECTRICO - 24/06/2026 - 24/06/2026 [T1] - 24/06/2026
TPM-FALLA MOTOR PERDIDA DE AISLAMIENTO - ELECTRICO - 25/06/2026 - 25/06/2026 [T1] - 25/06/2026
MTTO 3M DAMPER CAPOTA MP1 - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1] - 24/06/2026
MTTO 1A RODILLO SUCCION - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1] - 24/06/2026
MTTO CAPOTA - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2] | 24/06/2026 [T1, T2] | 25/06/2026 [T1, T2] - 25/06/2026
MTTO 1A CILINDRO YANKEE MP1 - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] - 24/06/2026
MTTO 1A CALDERA 5 - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2] | 24/06/2026 [T1, T2] | 25/06/2026 [T1, T2] | 26/06/2026 [T1, T2] | 27/06/2026 [T1, T2] | 28/06/2026 [T1, T2] - 28/06/2026
MTTO 2A POZO AGUA N°05 - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2] | 24/06/2026 [T1, T2] - 24/06/2026
MTTO 1A  PULPER PP1 - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] | 25/06/2026 [T1, T2, T3] | 26/06/2026 [T1, T2, T3] | 27/06/2026 [T1, T2, T3] | 28/06/2026 [T1, T2, T3] - 28/06/2026
TANQUES AIRE - VAPOR - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2] | 24/06/2026 [T1, T2] | 25/06/2026 [T1, T2] - 25/06/2026
RODILLERIA - MECANICO - 24/06/2026 - 24/06/2026 [T1, T2, T3] | 25/06/2026 [T1, T2, T3] - 25/06/2026
LAVADO QUIMICO BOMBAS VACIO - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2, T3] - 22/06/2026
REDUCTORES (Pulper + otros) - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] - 24/06/2026
MTTO 6M EXTRACTOR VAHO VE-95 MP1 - MECANICO - 24/06/2026 - 24/06/2026 [T1, T2] - 24/06/2026
CAMBIO DE ROTOR Y CRIBA DE LA PERA - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] - 24/06/2026
MANTENIMIENTO VALVULAS - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] - 24/06/2026
MTTO 2A CILIND HIDRAU LEVANT L.A NIPCOFL (INSPECCION) - MECANICO - 24/06/2026 - 24/06/2026 [T1, T2, T3] - 24/06/2026
CAMBIO CHUMACERAS HVAC - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2] - 22/06/2026
MANTENIMIENTO CARDANES - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] - 24/06/2026
TPM-A-PRED_DESGASTE_RODA_CHU_DIABOLO - MECANICO - 24/06/2026 - 24/06/2026 [T1] - 24/06/2026
MTTO 1A DAF PTAR - MECANICO - 24/06/2026 - 24/06/2026 [T2, T3] - 24/06/2026
MTTO 2M/1A CHORRO PASA PUNTA MP1 - MECANICO - 25/06/2026 - 25/06/2026 [T1] - 25/06/2026
MTTO 1M CHILLING SHOWER MP1 - MECANICO - 25/06/2026 - 25/06/2026 [T1] - 25/06/2026
MTTO 3M SISTEMA MECANICO QCS MP1 - MECANICO - 25/06/2026 - 25/06/2026 [T1] - 25/06/2026
MTTO 4M SVECOM MP1 - MECANICO - 25/06/2026 - 25/06/2026 [T2, T3] - 25/06/2026
MTTO 4M MECA ENFAJILLADORA MP1 - MECANICO - 25/06/2026 - 25/06/2026 [T2, T3] - 25/06/2026
MONTAJE DE ACOPLE DE BOMBA DE VACIO 32 - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2] - 22/06/2026
P TPM-A-PRED AGITADOR 120-AG-11B - MECANICO - 25/06/2026 - 25/06/2026 [T1, T2] - 25/06/2026
INSPECCION IMPULSOR FAM PUM - MECANICO - 24/06/2026 - 24/06/2026 [T3] | 25/06/2026 [T1] - 25/06/2026
TPM-MTTO CORREC  CALIB. VV REGULADORA GN - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026
CAMBIO DE RECUBRIMIENTO DE RODILLOS - CAVAL - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
CAMBIO DE ENCHAQUETADO ZONA DE MESANINE - MECANICO - 24/06/2026 - 24/06/2026 [T1, T2, T3] - 24/06/2026
MTTO 5A TANQUE FLASH PTER - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2] - 22/06/2026
MTTO 1A ENSAYOS END QUEMADOR 120-VE-01 - MECANICO - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
TPM-A-PRED_DESALINEAMIENT_EJE_120BV30 (PRED - INFR) - PREDICTIVO - 23/06/2026 - 23/06/2026 [T1] - 23/06/2026
P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV31 (PRED - INFR) - PREDICTIVO - 23/06/2026 - 23/06/2026 [T1] - 23/06/2026
P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV32 (PRED - INFR) - PREDICTIVO - 23/06/2026 - 23/06/2026 [T1] - 23/06/2026
CAMBIO DE GRASAS Y LUBRICANTES - PREDICTIVO - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] | 25/06/2026 [T1, T2, T3] - 25/06/2026
ALINEAMIENTO DE RODILLO SUCCIÓN - PREDICTIVO - 25/06/2026 - 25/06/2026 [T1, T2, T3] - 25/06/2026
TPM-CAMBIO DE PLANCHA TRANSP. DE FARDOS - INFRAESTRUCTURA - 22/06/2026 - 22/06/2026 [T1, T2] - 22/06/2026
F TPMR-TANQUE-ROMPE-PURGA-LINEA-PICADURA - INFRAESTRUCTURA - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
TPM-FALTA GUARDA TORNILLO DE RECHAZO - INFRAESTRUCTURA - 23/06/2026 - 23/06/2026 [T2, T3] - 23/06/2026
TPM R CORROSION DE ESTRUCTURA 120RTU151 - INFRAESTRUCTURA - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2] - 24/06/2026
TPM R CORROSION DE ESTRUCTURA 120RTU152 - INFRAESTRUCTURA - 24/06/2026 - 24/06/2026 [T1, T2, T3] | 25/06/2026 [T1, T2, T3] | 26/06/2026 [T1, T2, T3] - 26/06/2026
TPM-CAMBIO DE TUBERIA CONDUIT TECHO MP - INFRAESTRUCTURA - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2] | 24/06/2026 [T1, T2] | 25/06/2026 [T1, T2] | 26/06/2026 [T1, T2] - 26/06/2026
LUCERNALIAS DE TECHO DE MP1 CON CORROSIÓN - INFRAESTRUCTURA - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] | 25/06/2026 [T1, T2, T3] | 26/06/2026 [T1, T2, T3] | 27/06/2026 [T1, T2, T3] | 28/06/2026 [T1, T2, T3] - 28/06/2026
TPM INST. MEDIDOR DE FLUJO DE GAS - INSTRUMENTACIÓN - 22/06/2026 - 22/06/2026 [T1] - 22/06/2026
TPM F SERVER SIEMENS EST. CONTROL 1 - INSTRUMENTACIÓN - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2] - 23/06/2026
TPM CALIB MEDIDOR SALIDA VAPOR FIT X4310 - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
TPM CALIB. MEDIDOR FLUJO DE VAPOR FT 516 - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
TPM. MIGRACION SIST. DE CONTROL - INSTRUMENTACIÓN - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2] | 24/06/2026 [T1, T2] - 24/06/2026
MANTTO ROTAMETRO DEL ABLANDADOR - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
MANTTO SIST TANQUE CONDENSADO CALDERA - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
MANTTO MENSUAL DE SENSORES - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T1, T2] - 23/06/2026
MANTTO PREVENTIVO PISTONES NEUMATICO - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T2, T3] - 23/06/2026
MANTTO SEMESTRAL TABLEROS NEUMATICOS PP1 - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T2, T3] - 23/06/2026
MANTTO SEMESTRAL SISTEMA PESAJE PULPER - INSTRUMENTACIÓN - 22/06/2026 - 22/06/2026 [T1, T2] | 23/06/2026 [T1, T2] | 24/06/2026 [T1, T2] - 24/06/2026
TRABAJOS VARIOS EN INSTRUMENTACIÓN - INSTRUMENTACIÓN - 23/06/2026 - 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] - 24/06/2026
MANTENIMIENTO PREVENTIVO PISTON NEUMATIC - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T1, T2] - 25/06/2026
MANTTO 6M VALVULA CONTROL - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T1, T2] - 25/06/2026
MANTTO MENSUAL DE SENSORES - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T1, T2] - 25/06/2026
MANTTO MENSUAL DE SENSORES - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T1, T2] - 25/06/2026
CAMB 4A REPETID PROFI TABL 120ABC21ES22 - INSTRUMENTACIÓN - 24/06/2026 - 24/06/2026 [T1, T2] - 24/06/2026
CAMB 4A REPETID PROFI TABL 120ABC11ES11 - INSTRUMENTACIÓN - 24/06/2026 - 24/06/2026 [T1, T2] - 24/06/2026
LIMP QUIMICA TUBOS AGUA (PASIVADO) - INSTRUMENTACIÓN - 24/06/2026 - 24/06/2026 [T1, T2] - 24/06/2026
MANTTO SISTEMA COMBUSTIBLE Y QUEMADOR - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T2, T3] - 25/06/2026
MTTO 6M REGADERA RODILLO SUCCION - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T2, T3] - 25/06/2026
MTTO 6M VALVULAS ON/OFF REGADERA TELA - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T2, T3] - 25/06/2026
PRUEBAS DE INTERLOCK - INSTRUMENTACIÓN - 25/06/2026 - 25/06/2026 [T2, T3] | 26/06/2026 [T1] - 26/06/2026
MTTO 2M PALPADORES PRENSA LODOS 1 - INSTRUMENTACIÓN - 24/06/2026 - 24/06/2026 [T1, T2, T3] - 24/06/2026
MTTO 2M PALPADORES PRENSA LODOS 2 - INSTRUMENTACIÓN - 24/06/2026 - 24/06/2026 [T1, T2, T3] - 24/06/2026
REPARACIÓN DE TECHO MP1 LADO MEZANINE - INFRAESTRUCTURA - 22/06/2026 - 22/06/2026 [T1, T2, T3] | 23/06/2026 [T1, T2, T3] | 24/06/2026 [T1, T2, T3] | 25/06/2026 [T1, T2, T3] | 26/06/2026 [T1, T2, T3] - 26/06/2026`;

const loadInitialData = () => {
  const rows = rawDatabase.trim().split('\n');
  return rows.map((row, index) => {
      const parsed = parseFormattedLine(row);
      if (!parsed) return null;
      return { id: index + 1, ...parsed };
  }).filter(Boolean);
};

export default function App() {
  const [data, setData] = useState(loadInitialData());
  const [view, setView] = useState('dashboard');
  const [pasteData, setPasteData] = useState('');
  const [modalOpen, setModalOpen] = useState(null); 
  const [expandedRows, setExpandedRows] = useState(new Set()); 
  
  const [showForms, setShowForms] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  
  const [toastMsg, setToastMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
  
  const [planningDate, setPlanningDate] = useState(new Date('2026-06-22T00:00:00'));
  const [filterResponsable, setFilterResponsable] = useState('');
  
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const [formData, setFormData] = useState({
    actividad: '', responsable: '', fechaInicio: '', fechaFin: '',
    turnoT1: true, turnoT2: true, turnoT3: true
  });

  useEffect(() => {
    if(toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    if (view === 'planning' && tableScrollRef.current && tableScrollRef.current.firstChild) {
      setTableScrollWidth(tableScrollRef.current.firstChild.scrollWidth);
    }
  }, [view, data, planningDate, expandedRows, filterResponsable, isCompactMode, showCriticalPath]);

  const handleTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  const getDaysArray = (start, days) => {
    const arr = [];
    for (let i = 0; i < days; i++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + i); arr.push(dt);
    }
    return arr;
  };
  
  const formatDateKey = (date) => date.toISOString().split('T')[0];
  const isDateInRange = (checkDateStr, startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return false;
    const check = new Date(checkDateStr + 'T00:00:00');
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    return check >= start && check <= end;
  };

  const handleMonthClick = (monthIndex) => {
    const currentYear = planningDate.getFullYear();
    setPlanningDate(new Date(currentYear, monthIndex, 1));
  };

  const toggleRowExpanded = (id) => {
      setExpandedRows(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddData = (e) => {
    e.preventDefault();
    if (!formData.actividad) return;

    let newCronograma = {};
    const selectedShifts = [];
    if (formData.turnoT1) selectedShifts.push('T1');
    if (formData.turnoT2) selectedShifts.push('T2');
    if (formData.turnoT3) selectedShifts.push('T3');

    if (formData.fechaInicio && formData.fechaFin) {
        const start = new Date(formData.fechaInicio + 'T00:00:00');
        const end = new Date(formData.fechaFin + 'T00:00:00');
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            newCronograma[dt.toISOString().split('T')[0]] = [...selectedShifts]; 
        }
    }

    const newItem = {
      id: Date.now(), 
      actividad: formData.actividad, 
      responsable: formData.responsable.toUpperCase(), 
      fechaInicio: formData.fechaInicio, 
      fechaFin: formData.fechaFin, 
      cronograma: newCronograma
    };
    setData(prev => [newItem, ...prev]);
    setFormData({ actividad: '', responsable: '', fechaInicio: '', fechaFin: '', turnoT1: true, turnoT2: true, turnoT3: true });
    setToastMsg("Registro agregado correctamente.");
  };

  const handleDelete = (id) => {
     setConfirmDialog({
       isOpen: true,
       message: '¿Estás seguro de que deseas eliminar este registro específico?',
       onConfirm: () => {
         setData(prev => prev.filter(item => item.id !== id));
         setToastMsg("Registro eliminado.");
       }
     });
  };

  const handleClearAll = () => { 
    setConfirmDialog({
       isOpen: true,
       message: '¿Estás seguro de vaciar toda la base de datos? Esta acción no se puede deshacer.',
       onConfirm: () => {
         setData([]);
         setToastMsg("Base de datos limpiada por completo.");
       }
    });
  };

  const handlePasteProcess = () => {
    if (!pasteData.trim()) return;
    const rows = pasteData.trim().split('\n');
    const newItems = [];
    let successCount = 0;

    rows.forEach((row, index) => {
        const parsed = parseFormattedLine(row);
        if (parsed) {
             newItems.push({
                id: `PASTE-${Date.now()}-${index}`,
                ...parsed
             });
             successCount++;
        }
    });

    if (newItems.length > 0) {
        setData(prev => [...newItems, ...prev]);
        setPasteData('');
        setToastMsg(`¡Importación exitosa! Se añadieron ${successCount} actividades.`);
    } else {
        setToastMsg("No se pudieron leer los datos. Verifica el formato.");
    }
  };

  // --- INTERACTIVIDAD: CLIC EN GRÁFICOS PARA FILTRAR GANTT ---
  const handleChartClick = (dataEntry) => {
      if (!dataEntry) return;
      const payload = dataEntry.payload || dataEntry;
      
      let filterTarget = '';
      // Si hacemos clic en un responsable, filtramos por él.
      if (payload.name && uniqueResponsables.includes(payload.name)) {
          filterTarget = payload.name;
      } else if (payload.responsable && uniqueResponsables.includes(payload.responsable)) {
          filterTarget = payload.responsable;
      }

      setFilterResponsable(filterTarget);
      setView('planning'); // Navegamos directo al Gantt
  };

  // --- CÁLCULOS ESTADÍSTICOS PROFUNDOS ---
  const uniqueResponsables = useMemo(() => {
    const resps = new Set(data.map(d => d.responsable).filter(Boolean));
    return Array.from(resps).sort(); 
  }, [data]);

  const planningDays = useMemo(() => getDaysArray(planningDate, 7), [planningDate]);

  const metrics = useMemo(() => {
    const byResponsable = {};
    const turnosCount = { T1: 0, T2: 0, T3: 0 };
    const esfuerzoEquiposMap = {};
    let cortas = 0, medianas = 0, largas = 0;
    const topTareasMap = [];
    let totalTurnosProgramados = 0;
    let maxDuration = 0;

    data.forEach(item => {
        const resp = item.responsable || "SIN ASIGNAR";
        byResponsable[resp] = (byResponsable[resp] || 0) + 1;

        // 1. Cálculo de Duración Real en Días para Clasificación y Top 5
        let duration = 0;
        if (item.fechaInicio && item.fechaFin) {
            const start = new Date(item.fechaInicio + 'T00:00:00');
            const end = new Date(item.fechaFin + 'T00:00:00');
            duration = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1);
        }
        
        if (duration > maxDuration) maxDuration = duration;

        if (duration === 1) cortas++;
        else if (duration === 2 || duration === 3) medianas++;
        else if (duration > 3) largas++;

        topTareasMap.push({ actividad: item.actividad, duracion: duration, responsable: resp });

        // 2. Cálculo de Esfuerzo por Turnos Asignados
        let itemShifts = 0;
        if (item.cronograma) {
            Object.values(item.cronograma).forEach(shifts => {
                if (Array.isArray(shifts)) {
                    shifts.forEach(s => {
                        const shiftStr = String(s).toUpperCase().trim();
                        if (turnosCount[shiftStr] !== undefined) turnosCount[shiftStr]++;
                        itemShifts++;
                        totalTurnosProgramados++;
                    });
                }
            });
        }
        esfuerzoEquiposMap[resp] = (esfuerzoEquiposMap[resp] || 0) + itemShifts;
    });

    const chartDataResponsable = Object.keys(byResponsable)
      .map(key => ({ name: key, count: byResponsable[key] }))
      .sort((a, b) => b.count - a.count);

    const chartDataTurnos = [
        { name: 'T1 (Mañana)', count: turnosCount.T1, fill: '#38bdf8' },
        { name: 'T2 (Tarde)', count: turnosCount.T2, fill: '#fb923c' },
        { name: 'T3 (Noche)', count: turnosCount.T3, fill: '#818cf8' },
    ].filter(d => d.count > 0);

    const chartDataEsfuerzo = Object.keys(esfuerzoEquiposMap)
      .map(key => ({ name: key, turnos: esfuerzoEquiposMap[key] }))
      .sort((a, b) => b.turnos - a.turnos);

    const chartDataDuracion = [
        { name: 'Cortas (1 día)', count: cortas, fill: '#10b981' },
        { name: 'Medianas (2-3 días)', count: medianas, fill: '#f59e0b' },
        { name: 'Largas (+3 días)', count: largas, fill: '#ef4444' },
    ].filter(d => d.count > 0);

    const top5Tareas = topTareasMap.sort((a, b) => b.duracion - a.duracion).slice(0, 5);
    
    let planningData = [...data];
    if(filterResponsable) planningData = planningData.filter(d => d.responsable === filterResponsable);
    
    if (showCriticalPath && maxDuration > 0) {
        planningData = planningData.filter(item => {
            if (!item.fechaInicio || !item.fechaFin) return false;
            const start = new Date(item.fechaInicio + 'T00:00:00');
            const end = new Date(item.fechaFin + 'T00:00:00');
            const duration = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1);
            return duration === maxDuration;
        });
    }

    planningData.sort((a,b) => a.responsable.localeCompare(b.responsable));

    return { 
        chartDataResponsable, planningData, chartDataTurnos, chartDataEsfuerzo, 
        chartDataDuracion, top5Tareas, totalTurnosProgramados 
    };
  }, [data, filterResponsable, showCriticalPath]);

  // Evolución de Carga Diaria (Calculada sobre los 7 días visibles en planeación)
  const evolucionDiaria = useMemo(() => {
    return planningDays.map(day => {
        const dateKey = formatDateKey(day);
        let activas = 0;
        data.forEach(item => {
            const shifts = (item.cronograma && item.cronograma[dateKey]) || [];
            if (shifts.length > 0) {
                activas++;
            }
        });
        return {
            name: day.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }).toUpperCase(),
            activas
        };
    });
  }, [data, planningDays]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-in slide-in-from-bottom-5 flex items-center justify-between min-w-[300px]">
           <span className="font-medium text-sm">{toastMsg}</span>
           <button onClick={() => setToastMsg('')} className="ml-4 text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Acción</h3>
             <p className="text-slate-600 mb-6 text-sm">{confirmDialog.message}</p>
             <div className="flex justify-end space-x-3">
               <button onClick={() => setConfirmDialog({...confirmDialog, isOpen: false})} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
               <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({...confirmDialog, isOpen: false}); }} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm">Sí, eliminar</button>
             </div>
          </div>
        </div>
      )}

      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="text-indigo-400" />
            <span className="text-lg font-semibold tracking-wide text-slate-100">DASHBOARD PARADAS MTTO</span>
          </div>
          <nav className="flex space-x-2">
            <button onClick={() => setView('dashboard')} className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                <LayoutDashboard size={16} className="mr-2"/> Resumen
            </button>
            <button onClick={() => setView('planning')} className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-colors ${view === 'planning' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                <Calendar size={16} className="mr-2"/> Planeación
            </button>
            <button onClick={() => setView('entry')} className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-colors ${view === 'entry' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                <Table size={16} className="mr-2"/> Gestión
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= VISTA: DASHBOARD ================= */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Resumen de Actividades Generales</h2>
                <p className="text-slate-500 text-sm mt-1">Análisis estratégico y operativo de las paradas de mantenimiento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard title="TOTAL DE ACTIVIDADES" value={data.length} subtext="Programadas en sistema" icon={Briefcase} colorClass="bg-indigo-600" borderClass="border-indigo-600" />
              <KpiCard title="EQUIPOS INVOLUCRADOS" value={uniqueResponsables.length} subtext="Departamentos responsables" icon={Activity} colorClass="bg-emerald-500" borderClass="border-emerald-500" />
              <KpiCard title="RANGO DE PLANEACIÓN" value={planningDays.length} subtext="Días Ventana de visualización actual" icon={Calendar} colorClass="bg-orange-500" borderClass="border-orange-500" />
            </div>

            {/* Fila 1 de Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 relative">
                <button onClick={() => setModalOpen('RESP')} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded hover:bg-indigo-50" title="Ver hoja completa">
                   <Maximize2 size={20} />
                </button>
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-indigo-600 mr-2"></span>Actividades por Responsable</h3>
                {data.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataResponsable} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                        <RechartsTooltip formatter={(value) => [value, 'Actividades']} contentStyle={{borderRadius:'8px'}} cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={handleChartClick} className="cursor-pointer">
                          <LabelList dataKey="count" position="top" style={{ fontSize: '11px', fill: '#475569', fontWeight: 'bold' }} />
                          {metrics.chartDataResponsable.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getResponsableColor(entry.name, uniqueResponsables)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400">Sin datos</div>}
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-orange-500 mr-2"></span>Esfuerzo Operativo (Turnos por Equipo)</h3>
                {data.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataEsfuerzo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                        <RechartsTooltip formatter={(value) => [value, 'Turnos']} contentStyle={{borderRadius:'8px'}} cursor={{fill: '#fff7ed'}} />
                        <Bar dataKey="turnos" radius={[4, 4, 0, 0]} onClick={handleChartClick} className="cursor-pointer">
                          <LabelList dataKey="turnos" position="top" style={{ fontSize: '11px', fill: '#475569', fontWeight: 'bold' }} />
                          {metrics.chartDataEsfuerzo.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getResponsableColor(entry.name, uniqueResponsables)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400">Sin datos</div>}
              </Card>
            </div>

            {/* Fila 2 de Gráficos (Donas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-2 flex items-center"><span className="w-1 h-4 bg-sky-400 mr-2"></span>Distribución de Carga por Turnos</h3>
                {data.length > 0 ? (
                  <div className="h-72 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.chartDataTurnos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="count" label={renderCustomizedLabel} labelLine={true}>
                          {metrics.chartDataTurnos.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer hover:opacity-80" onClick={() => handleChartClick(entry)} />))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [value, 'Turnos Programados']} contentStyle={{borderRadius:'8px'}} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400">Sin datos</div>}
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-2 flex items-center"><span className="w-1 h-4 bg-rose-500 mr-2"></span>Clasificación por Duración de Tareas</h3>
                {data.length > 0 ? (
                  <div className="h-72 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.chartDataDuracion} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="count" label={renderCustomizedLabel} labelLine={true}>
                          {metrics.chartDataDuracion.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer hover:opacity-80" onClick={() => handleChartClick(entry)} />))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [value, 'Actividades']} contentStyle={{borderRadius:'8px'}} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400">Sin datos</div>}
              </Card>
            </div>

            {/* Fila 3 de Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 h-[400px] flex flex-col">
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-red-500 mr-2"></span>Top 5 Tareas de Mayor Duración</h3>
                 <div className="flex-1 overflow-hidden">
                    {metrics.top5Tareas.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.top5Tareas} layout="vertical" margin={{top:5, right:40, left:10, bottom:5}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                                <XAxis type="number" hide />
                                <YAxis dataKey="actividad" type="category" width={160} tick={{fontSize:10, fill:'#475569'}} />
                                <RechartsTooltip cursor={{fill: '#fee2e2'}} formatter={(value) => [`${value} días`, 'Duración']} />
                                <Bar dataKey="duracion" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={25} onClick={handleChartClick} className="cursor-pointer">
                                    <LabelList dataKey="duracion" position="right" formatter={(val) => `${val} d`} style={{ fontSize: '11px', fill: '#b91c1c', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                 </div>
               </Card>

               <Card className="p-6 h-[400px] flex flex-col">
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-purple-500 mr-2"></span>Evolución de Carga Diaria (Próximos 7 días)</h3>
                 <div className="flex-1 overflow-hidden">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={evolucionDiaria} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} />
                                <YAxis tick={{fontSize: 12, fill: '#64748b'}} allowDecimals={false} />
                                <RechartsTooltip formatter={(value) => [value, 'Actividades Concurrentes']} contentStyle={{borderRadius:'8px'}} />
                                <Area type="monotone" dataKey="activas" stroke="#8b5cf6" fill="#c4b5fd" activeDot={{ r: 6 }} className="cursor-pointer" onClick={() => setView('planning')} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                 </div>
               </Card>
            </div>

             {/* Modal extra para zoom */}
             <FullScreenModal isOpen={modalOpen === 'RESP'} onClose={() => setModalOpen(null)} title="Actividades por Responsable" contentId="modal-resp">
                <div className="h-[600px]" id="modal-resp">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataResponsable} margin={{ top: 40, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 14, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} width={50}/>
                        <RechartsTooltip formatter={(value) => [value, 'Actividades']} contentStyle={{borderRadius:'8px'}} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={handleChartClick} className="cursor-pointer">
                          <LabelList dataKey="count" position="top" style={{ fontSize: '14px', fill: '#475569', fontWeight: 'bold' }} />
                          {metrics.chartDataResponsable.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getResponsableColor(entry.name, uniqueResponsables)} />
                          ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </FullScreenModal>
          </div>
        )}

        {/* ================= VISTA: PLANEACIÓN GANTT ================= */}
        {view === 'planning' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                   <Calendar className="mr-3 text-indigo-600" /> Planeación de Mantenimiento
                 </h2>
                 
                 {/* Botones de Vista (Detalle vs Compacta) y Ruta Crítica */}
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowCriticalPath(!showCriticalPath)}
                      className={`flex items-center px-4 py-1.5 text-xs font-bold rounded-md transition-all border ${showCriticalPath ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      title="Ver tareas de mayor duración"
                    >
                      <Flame size={14} className={`mr-1.5 ${showCriticalPath ? 'text-red-500' : 'text-slate-400'}`}/> Ruta Crítica
                    </button>
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
                       <button 
                         onClick={() => setIsCompactMode(false)}
                         className={`flex items-center px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!isCompactMode ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                       >
                         <Maximize size={14} className="mr-1.5"/> Versión Detalle
                       </button>
                       <button 
                         onClick={() => setIsCompactMode(true)}
                         className={`flex items-center px-4 py-1.5 text-xs font-bold rounded-md transition-all ${isCompactMode ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                       >
                         <Minimize size={14} className="mr-1.5"/> Versión Compacta
                       </button>
                    </div>
                 </div>
               </div>

               <div className="space-y-5 mt-6">
                 {/* Filtro por Meses */}
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Navegación por Meses (Año Actual)</span>
                   <div className="flex w-full bg-slate-100/70 p-1 rounded-xl border border-slate-200 shadow-inner">
                       {MONTHS.map((m, index) => {
                           const isActive = planningDate.getMonth() === index;
                           return (
                               <button 
                                   key={m} 
                                   onClick={() => handleMonthClick(index)}
                                   className={`flex-1 px-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${isActive ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                               >
                                   {m}
                               </button>
                           )
                       })}
                   </div>
                 </div>

                 {/* Filtro por Responsables */}
                 <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Filtrar por Centro de Responsabilidad</span>
                   <div className="flex w-full bg-slate-100/70 p-1 rounded-xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
                       <button 
                           onClick={() => setFilterResponsable('')}
                           className={`flex-1 min-w-[80px] px-2 py-2 text-xs font-bold rounded-lg transition-all ${filterResponsable === '' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                       >
                           TODOS
                       </button>
                       {uniqueResponsables.map(resp => {
                           const isActive = filterResponsable === resp;
                           const color = getResponsableColor(resp, uniqueResponsables);
                           return (
                               <button 
                                   key={resp} 
                                   onClick={() => setFilterResponsable(resp)}
                                   className={`flex-1 min-w-[120px] px-2 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${isActive ? 'bg-white shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                                   style={isActive ? { color: color } : {}}
                               >
                                   <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                                   <span className="truncate">{resp}</span>
                               </button>
                           )
                       })}
                   </div>
                 </div>

                 {/* Controles de Navegación (7 Días) */}
                 <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 mt-2">
                     <button 
                       onClick={() => { const d = new Date(planningDate); d.setDate(d.getDate() - 7); setPlanningDate(d); }} 
                       className="flex items-center px-4 py-2 hover:bg-white rounded-md shadow-sm transition-colors text-slate-700 text-sm font-bold"
                     >
                       <ChevronLeft size={18} className="mr-1"/> Anterior
                     </button>
                     <div className="px-4 py-1 font-black text-indigo-900 text-sm uppercase tracking-wider">
                        {planningDays[0].toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })} - {planningDays[6].toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })}
                     </div>
                     <button 
                       onClick={() => { const d = new Date(planningDate); d.setDate(d.getDate() + 7); setPlanningDate(d); }} 
                       className="flex items-center px-4 py-2 hover:bg-white rounded-md shadow-sm transition-colors text-slate-700 text-sm font-bold"
                     >
                       Siguiente <ChevronRight size={18} className="ml-1"/>
                     </button>
                 </div>
               </div>
            </div>

            <Card className="overflow-hidden bg-white">
                {/* --- Barra de Scroll Superior Sincronizada --- */}
                <div 
                    ref={topScrollRef} 
                    onScroll={handleTopScroll} 
                    className="overflow-x-auto w-full custom-scrollbar bg-slate-100 border-b border-slate-200"
                    style={{ height: '12px' }}
                >
                    <div style={{ width: tableScrollWidth, height: '1px' }}></div>
                </div>

                <div 
                    ref={tableScrollRef} 
                    onScroll={handleTableScroll}
                    className="overflow-x-auto w-full custom-scrollbar"
                >
                   <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr>
                            <th className={`bg-slate-50 border-b border-r border-slate-200 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)] align-bottom ${isCompactMode ? 'p-2 min-w-[200px]' : 'p-4 min-w-[320px]'}`}>
                                <div className={`font-black text-indigo-900 capitalize mb-1 ${isCompactMode ? 'text-sm' : 'text-lg'}`}>
                                    {planningDays[0].toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                                </div>
                                <span className={`font-bold text-slate-500 uppercase ${isCompactMode ? 'text-[9px]' : 'text-xs'}`}>Actividad & Responsable</span>
                            </th>
                            {planningDays.map((day, i) => (
                                <th key={i} className={`bg-slate-50 border-b border-r border-slate-200 text-center p-0 align-bottom ${isCompactMode ? 'min-w-[70px]' : 'min-w-[120px]'}`}>
                                    <div className={`bg-slate-100 h-full flex flex-col justify-center ${isCompactMode ? 'py-1' : 'py-3'}`}>
                                        <span className={`font-bold text-slate-500 uppercase ${isCompactMode ? 'text-[9px]' : 'text-xs block'}`}>
                                            {day.toLocaleDateString('es-CO', { weekday: 'short' })}
                                        </span>
                                        <span className={`text-slate-800 font-black ${isCompactMode ? 'text-sm ml-1 inline-block' : 'text-xl mt-1 block'}`}>
                                            {day.getDate()}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                         {metrics.planningData.map((item) => {
                             const rowSchedule = item.cronograma || {};
                             const isExpanded = expandedRows.has(item.id);
                             const rowColor = getResponsableColor(item.responsable, uniqueResponsables);

                             return (
                                <tr key={item.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                                    <td 
                                      className={`border-r border-slate-200 bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-slate-50 ${isCompactMode ? 'p-1 px-2' : 'p-4'}`}
                                      onClick={() => toggleRowExpanded(item.id)}
                                      title="Clic para expandir/contraer turnos"
                                    >
                                        <div className={`flex ${isCompactMode ? 'items-center' : 'items-start'}`}>
                                            <button className={`text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50 ${isCompactMode ? 'mr-1' : 'mr-3 p-1 mt-0.5'}`}>
                                                {isExpanded ? <ChevronDown size={isCompactMode ? 12 : 18}/> : <ChevronRight size={isCompactMode ? 12 : 18}/>}
                                            </button>
                                            <div className={`flex-1 ${isCompactMode ? 'flex items-center justify-between gap-2 overflow-hidden' : ''}`}>
                                                <div className={`font-bold text-slate-800 ${isCompactMode ? 'text-[9px] truncate' : 'text-xs mb-1 line-clamp-2'}`} title={item.actividad}>
                                                    {item.actividad}
                                                </div>
                                                <div className={`flex items-center ${isCompactMode ? 'shrink-0' : 'justify-between mt-1'}`}>
                                                    <span className={`text-white px-1.5 rounded-full font-bold shadow-sm ${isCompactMode ? 'text-[8px] py-0 whitespace-nowrap' : 'text-[10px] py-0.5'}`} style={{ backgroundColor: rowColor }}>
                                                        {item.responsable}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {planningDays.map((day, i) => {
                                        const dateKey = formatDateKey(day);
                                        const shifts = rowSchedule[dateKey] || [];
                                        
                                        const hasWork = shifts.length > 0;
                                        
                                        if (isExpanded) {
                                            if (!hasWork) {
                                                return <td key={i} className="border-r border-slate-200 bg-slate-50/30 cursor-pointer" onClick={() => toggleRowExpanded(item.id)}></td>;
                                            }
                                            return (
                                                <td key={i} className="border-r border-slate-200 p-0 align-top h-full cursor-pointer" onClick={() => toggleRowExpanded(item.id)}>
                                                    <div className={`grid grid-cols-3 h-full ${isCompactMode ? 'min-h-[22px]' : 'min-h-[50px]'}`}>
                                                        {['T1', 'T2', 'T3'].map(shift => {
                                                            const isActive = shifts.includes(shift);
                                                            return (
                                                                <div 
                                                                    key={shift} 
                                                                    className={`transition-all flex items-center justify-center border-r border-white/50 last:border-r-0 ${isActive ? 'bg-[#fef08a] shadow-inner' : 'bg-slate-100 hover:bg-slate-200'}`}
                                                                >
                                                                    <span className={`font-bold ${isCompactMode ? 'text-[8px]' : 'text-[9px]'} ${isActive ? 'text-black' : 'text-slate-400'}`}>
                                                                      {isCompactMode ? shift[1] : shift}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        } else {
                                            const barColor = filterResponsable === '' ? rowColor : '#3b82f6';
                                            return (
                                                <td key={i} className="border-r border-slate-100 p-0 h-full relative align-middle">
                                                    <div className={`w-full flex items-center cursor-pointer hover:bg-slate-50 ${isCompactMode ? 'h-[22px]' : 'h-[50px]'}`} onClick={() => toggleRowExpanded(item.id)}>
                                                        {hasWork ? (
                                                            <div 
                                                              className={`w-full transition-colors shadow-sm rounded-sm hover:opacity-80 ${isCompactMode ? 'h-3' : 'h-6'}`} 
                                                              style={{ backgroundColor: barColor }}
                                                              title="Clic para desglosar turnos"
                                                            ></div>
                                                        ) : (
                                                            <div className={`w-full transition-colors ${isCompactMode ? 'h-3' : 'h-6'}`}></div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        }
                                    })}
                                </tr>
                             );
                         })}
                         {metrics.planningData.length === 0 && (
                            <tr><td colSpan={8} className="p-8 text-center text-slate-400 italic">No se encontraron actividades.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-end text-xs text-slate-500 space-x-6">
                    <div className="flex items-center"><div className="w-4 h-4 bg-indigo-500 mr-2 rounded"></div> Periodo General</div>
                    <div className="flex items-center"><div className="w-4 h-4 bg-[#fef08a] border border-yellow-300 mr-2 rounded"></div> Turno Asignado</div>
                    <div className="flex items-center"><div className="w-4 h-4 bg-slate-100 border border-slate-200 mr-2 rounded"></div> Sin Asignar</div>
                </div>
            </Card>
          </div>
        )}

        {/* ================= VISTA: GESTIÓN ================= */}
        {view === 'entry' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            <div className="flex justify-start">
               <button 
                 onDoubleClick={() => setShowForms(!showForms)}
                 className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none"
                 title="Haz doble clic para mostrar/ocultar los paneles de registro"
               >
                 <Pencil size={14} className="mr-2 text-indigo-600"/> 
                 {showForms ? 'Doble clic para Ocultar Formularios' : 'Doble clic para Mostrar Formularios'}
               </button>
            </div>

            <div className={`grid grid-cols-1 ${showForms ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8 transition-all duration-300`}>
                
                {showForms && (
                  <div className="lg:col-span-1 space-y-6 animate-in slide-in-from-left duration-300">
                    <Card className="p-6 bg-indigo-50 border-indigo-200">
                        <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center uppercase">
                        <Clipboard className="mr-2 text-indigo-600" size={18}/> Pegado Masivo Inteligente
                      </h3>
                      <p className="text-xs text-indigo-700 mb-3">
                        Copia y pega desde Excel o texto. Formato exacto requerido:
                      </p>
                      <p className="text-[11px] text-indigo-800/80 mb-3 leading-relaxed font-mono bg-white p-2 rounded border border-indigo-100">
                        [ACTIVIDAD] - [PUESTO] - [FECHA INICIO] - [FECHAS Y TURNOS DETALLADOS] - [FECHA FIN]
                      </p>
                      <textarea 
                        rows={6} value={pasteData} onChange={(e) => setPasteData(e.target.value)}
                        className="w-full text-xs p-3 rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-400 mb-3 font-mono custom-scrollbar"
                        placeholder="Ejemplo 1 día:&#10;MTTO TRAFOS - ELECTRICO - 23/06/2026 - 23/06/2026 [T1, T2, T3] - 23/06/2026&#10;&#10;Ejemplo Varios días con saltos (|):&#10;MTTO 1A RODILLO - MECANICO - 22/06/2026 - 22/06/2026 [T1, T2] | 24/06/2026 [T3] - 24/06/2026"
                      />
                      <button type="button" onClick={handlePasteProcess} className="w-full py-2 bg-indigo-700 text-white rounded text-sm font-bold hover:bg-indigo-800 transition shadow-sm">
                          Procesar Datos al Gantt
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
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Responsable (Puesto)</label>
                          <input name="responsable" value={formData.responsable} onChange={handleInputChange} className="w-full rounded border-slate-300 p-2 text-sm border" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fecha Inicio</label>
                              <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleInputChange} className="w-full rounded border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2 text-sm border" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fecha Fin</label>
                              <input type="date" name="fechaFin" value={formData.fechaFin} onChange={handleInputChange} className="w-full rounded border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2 text-sm border" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Turnos a Asignar</label>
                                <div className="flex space-x-6 bg-white p-3 rounded border border-slate-300">
                                    <label className="flex items-center space-x-2 text-sm font-bold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="turnoT1" checked={formData.turnoT1} onChange={(e) => setFormData(prev => ({...prev, turnoT1: e.target.checked}))} className="rounded text-emerald-500 focus:ring-emerald-500" />
                                        <span>Turno 1 (T1)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm font-bold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="turnoT2" checked={formData.turnoT2} onChange={(e) => setFormData(prev => ({...prev, turnoT2: e.target.checked}))} className="rounded text-emerald-500 focus:ring-emerald-500" />
                                        <span>Turno 2 (T2)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm font-bold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="turnoT3" checked={formData.turnoT3} onChange={(e) => setFormData(prev => ({...prev, turnoT3: e.target.checked}))} className="rounded text-emerald-500 focus:ring-emerald-500" />
                                        <span>Turno 3 (T3)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" className="w-full flex justify-center py-2 px-4 rounded shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors">
                          Agregar Registro
                        </button>
                      </form>
                    </Card>
                  </div>
                )}

                <div className={showForms ? "lg:col-span-2" : "col-span-1"}>
                  <Card className="h-full flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
                       <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Base de Datos ({data.length} registros)</h3>
                       <div className="flex items-center space-x-3">
                          <button onClick={handleClearAll} className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 font-bold text-xs" title="Limpiar todo">
                            <Trash2 size={16} /> <span>VACIAR BASE DE DATOS</span>
                          </button>
                       </div>
                    </div>
                    <div className="overflow-x-auto flex-1 p-0 custom-scrollbar">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white text-xs uppercase font-semibold text-slate-400 sticky top-0 z-10 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3">Actividad</th>
                            <th className="px-6 py-3">Responsable</th>
                            <th className="px-6 py-3 text-center">Fecha inicio</th>
                            <th className="px-6 py-3 text-center">Fecha finalizacion</th>
                            <th className="px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-6 py-2 font-medium text-slate-900 max-w-xs truncate">{item.actividad}</td>
                              <td className="px-6 py-2 text-xs">{item.responsable}</td>
                              <td className="px-6 py-2 text-center text-xs text-slate-500 font-medium bg-slate-50/50 border-r border-white">
                                  {item.fechaInicio || '-'}
                              </td>
                              <td className="px-6 py-2 text-center text-xs text-slate-500 font-medium bg-slate-50/50">
                                  {item.fechaFin || '-'}
                              </td>
                              <td className="px-6 py-2 text-center">
                                <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {data.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">Base de datos vacía.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Estilos adicionales */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}