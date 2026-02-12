import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { 
  PlusCircle, Trash2, TrendingUp, Activity, LayoutDashboard, Table, CheckCircle, Clipboard, RefreshCw, DollarSign, Maximize2, X, Download, Calendar, ChevronLeft, ChevronRight, Filter, ChevronDown, Pencil, Maximize, Minimize
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
            <Activity className="mr-2 text-blue-600" size={24}/>
            {title}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => downloadChartAsPng(contentId, title.replace(/\s+/g, '_'))}
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
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
  const formattedValue = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  return (
    <text x={x} y={y} fill="#334155" textAnchor={textAnchor} dominantBaseline="central" fontSize="11" fontWeight="bold">
      {`${name}: ${formattedValue} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

const determineTipo = (val) => {
  const str = String(val || '').toUpperCase().trim();
  if (!str) return '';
  if (str.includes('PREVENTIVO')) return 'PREVENTIVO';
  if (str.includes('CORRECTIVO')) return 'CORRECTIVO';
  if (str.includes('MEJORA')) return 'MEJORA';
  return 'PREVENTIVO'; 
};

// --- Colores Consistentes ---
const COLORS = {
  API: '#1e3a8a',    
  OPEX: '#64748b',   
  PREV: '#10b981',   
  CORR: '#ef4444',   
  IMP: '#f59e0b',    
};

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

// --- Base de Datos Interna Creada Desde Tu Texto ---
const rawDatabase = `MTTO 1A RODILLO SUCCION-$12,000.00-OPEX-MECANICO-PREVENTIVO-22/06/2026-T1-24/06/2026-T1
MTTO CAPOTA-$7,000.00-API-MECANICO-PREVENTIVO-23/06/2026-T1-25/06/2026-T2
MTTO 1A CILINDRO YANKEE MP1-$14,000.00-OPEX-MECANICO-PREVENTIVO-23/06/2026-T1-24/06/2026-T3
MTTO 1A CALDERA 5-$30,000.00-API-MECANICO-PREVENTIVO-22/06/2026-T1-28/06/2026-T2
MTTO 2A POZO AGUA N°05-$16,326.30-OPEX-MECANICO-PREVENTIVO-22/06/2026-T1-24/06/2026-T2
MTTO 1A  PULPER PP1-$50,000.00-API-MECANICO-PREVENTIVO-22/06/2026-T1-25/06/2026-T3
TANQUES AIRE - VAPOR-$31,788.00-OPEX-MECANICO-PREVENTIVO-22/06/2026-T1-25/06/2026-T2
RODILLERIA-$--OPEX-MECANICO-PREVENTIVO-24/06/2026-T1-25/06/2026-T3
LAVADO QUIMICO BOMBAS VACIO-$3,000.00-OPEX-MECANICO-CORRECTIVO-22/06/2026-T1-22/06/2026-T3
REDUCTORES (Pulper + otros)-$54,000.00-OPEX-MECANICO-CORRECTIVO-23/06/2026-T1-24/06/2026-T3
MTTO 6M EXTRACTOR VAHO VE-95 MP1-$2,000.00-OPEX-MECANICO-PREVENTIVO-24/06/2026-T1-24/06/2026-T2
TPM- SERV. VOITH CAJA DE ENTRADA MP1-$62,000.00-OPEX-MECANICO-CORRECTIVO-22/06/2026-T2-25/06/2026-T2
CAMBIO DE ROTOR Y CRIBA DE LA PERA-$5,000.00-OPEX-MECANICO-CORRECTIVO-23/06/2026-T1-24/06/2026-T3
MANTENIMIENTO VALVULAS-$5,000.00-OPEX-MECANICO-PREVENTIVO-22/06/2026-T1-24/06/2026-T3
CAMBIO CHUMACERAS HVAC-$2,000.00-OPEX-MECANICO-CORRECTIVO-22/06/2026-T1-22/06/2026-T2
MANTENIMIENTO CARDANES-$4,000.00-OPEX-MECANICO-PREVENTIVO-23/06/2026-T1-24/06/2026-T3
TPM-A-PRED_DESGASTE_RODA_CHU_DIABOLO-$--OPEX-MECANICO-CORRECTIVO-24/06/2026-T1-24/06/2026-T1
MTTO 1A DAF PTAR-$--OPEX-MECANICO-PREVENTIVO-24/06/2026-T2-24/06/2026-T3
MTTO 2M/1A CHORRO PASA PUNTA MP1-$--OPEX-MECANICO-PREVENTIVO-25/06/2026-T1-25/06/2026-T1
MTTO 1M CHILLING SHOWER MP1-$--OPEX-MECANICO-PREVENTIVO-25/06/2026-T1-25/06/2026-T1
MTTO 3M SISTEMA MECANICO QCS MP1-$--OPEX-MECANICO-PREVENTIVO-25/06/2026-T1-25/06/2026-T1
MTTO 4M SVECOM MP1-$--OPEX-MECANICO-PREVENTIVO-25/06/2026-T2-25/06/2026-T3
MTTO 4M MECA ENFAJILLADORA MP1-$--OPEX-MECANICO-PREVENTIVO-25/06/2026-T2-25/06/2026-T3
MONTAJE DE ACOPLE DE BOMBA DE VACIO 32-$--OPEX-MECANICO-CORRECTIVO-22/06/2026-T1-22/06/2026-T2
P TPM-A-PRED AGITADOR 120-AG-11B-$--OPEX-MECANICO-CORRECTIVO-25/06/2026-T1-25/06/2026-T2
INSPECCION IMPULSOR FAM PUM-$--OPEX-MECANICO-PREVENTIVO-24/06/2026-T3-25/06/2026-T1
TPM-MTTO CORREC  CALIB. VV REGULADORA GN-$--OPEX-MECANICO-CORRECTIVO-23/06/2026-T1-23/06/2026-T3
CAMBIO DE RECUBRIMIENTO DE RODILLOS - CAVAL-$1,000.00-OPEX-MECANICO-CORRECTIVO-23/06/2026-T1-23/06/2026-T2
CAMBIO DE ENCHAQUETADO ZONA DE MESANINE-$2,500.00-OPEX-MECANICO-CORRECTIVO-24/06/2026-T1-24/06/2026-T3
MTTO 5A TANQUE FLASH PTER-$1,000.00-OPEX-MECANICO-PREVENTIVO-22/06/2026-T1-22/06/2026-T2
MTTO 1A ENSAYOS END QUEMADOR 120-VE-01-$1,000.00-OPEX-MECANICO-PREVENTIVO-23/06/2026-T1-23/06/2026-T2
INSTALACIÓN DE BOMBA DE VACIO DE CHILE-$100,000.00-OPEX-MECANICO-CORRECTIVO-22/06/2026-T1-26/06/2026-T3
MTTO  SUB ESTACIONES-$56,210.00-API-ELECTRICO-PREVENTIVO-23/06/2026-T1-23/06/2026-T3
MTTO TRAFOS-$--API-ELECTRICO-PREVENTIVO-23/06/2026-T1-23/06/2026-T3
MTTO 2A PREVENTIVO RED AEREA 22.9KV-$3,000.00-API-ELECTRICO-PREVENTIVO-23/06/2026-T1-23/06/2026-T3
MTTO CORRECTIVO 1A DRIVE DR100-$2,500.00-OPEX-ELECTRICO-PREVENTIVO-22/06/2026-T1-23/06/2026-T3
MTTO CORRECTIVO 1A DRIVE DR200-$2,500.00-OPEX-ELECTRICO-PREVENTIVO-23/06/2026-T1-23/06/2026-T3
MTTO 1A MCC1 MP1-$2,500.00-API-ELECTRICO-PREVENTIVO-23/06/2026-T1-23/06/2026-T3
MTTO 1A MCC2 MP1-$2,500.00-API-ELECTRICO-PREVENTIVO-23/06/2026-T1-23/06/2026-T3
MTTO 1A VENTILADORES-$1,500.00-OPEX-ELECTRICO-PREVENTIVO-22/06/2026-T1-23/06/2026-T2
MTTO 2A BUZONES MT 22.9KV-$100.00-OPEX-ELECTRICO-PREVENTIVO-24/06/2026-T1-24/06/2026-T2
PRUEBAS ELECTRICAS CABLES DE MEDIA TENSIÓN-$2,000.00-API-ELECTRICO-CORRECTIVO-23/06/2026-T1-23/06/2026-T3
TPM-AVERIA LAMPARA DE SEÑALIZACION CCM-$500.00-OPEX-ELECTRICO-CORRECTIVO-24/06/2026-T1-24/06/2026-T1
TPM-FALLA MOTOR PERDIDA DE AISLAMIENTO-$2,000.00-OPEX-ELECTRICO-CORRECTIVO-25/06/2026-T1-25/06/2026-T1
MTTO 3M DAMPER CAPOTA MP1-$3,000.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T1-24/06/2026-T1
TPM INST. MEDIDOR DE FLUJO DE GAS-$14,000.00-OPEX-INSTRUMENTACIÓN-MEJORA-22/06/2026-T1-22/06/2026-T1
TPM F SERVER SIEMENS EST. CONTROL 1-$6,000.00-OPEX-INSTRUMENTACIÓN-CORRECTIVO-22/06/2026-T1-23/06/2026-T2
TPM CALIB MEDIDOR SALIDA VAPOR FIT X4310-$2,000.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T1-23/06/2026-T2
TPM CALIB. MEDIDOR FLUJO DE VAPOR FT 516-$2,000.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T1-23/06/2026-T2
TPM. MIGRACION SIST. DE CONTROL-$1,300.00-OPEX-INSTRUMENTACIÓN-CORRECTIVO-22/06/2026-T1-24/06/2026-T2
MANTTO ROTAMETRO DEL ABLANDADOR-$--OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T1-23/06/2026-T2
MANTTO SIST TANQUE CONDENSADO CALDERA-$--OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T1-23/06/2026-T2
MANTTO MENSUAL DE SENSORES-$500.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T1-23/06/2026-T2
MANTTO PREVENTIVO PISTONES NEUMATICO-$1,500.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T2-23/06/2026-T2
MANTTO SEMESTRAL TABLEROS NEUMATICOS PP1-$200.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T2-23/06/2026-T3
MANTTO SEMESTRAL SISTEMA PESAJE PULPER-$3,000.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-22/06/2026-T1-24/06/2026-T2
TRABAJOS VARIOS EN INSTRUMENTACIÓN-$27,300.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-23/06/2026-T1-24/06/2026-T3
MANTENIMIENTO PREVENTIVO PISTON NEUMATIC-$500.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-25/06/2026-T1-25/06/2026-T2
MANTTO 6M VALVULA CONTROL-$--OPEX-INSTRUMENTACIÓN-PREVENTIVO-25/06/2026-T1-25/06/2026-T2
MANTTO MENSUAL DE SENSORES-$--OPEX-INSTRUMENTACIÓN-PREVENTIVO-25/06/2026-T1-25/06/2026-T2
MANTTO MENSUAL DE SENSORES-$--OPEX-INSTRUMENTACIÓN-PREVENTIVO-25/06/2026-T1-25/06/2026-T2
CAMB 4A REPETID PROFI TABL 120ABC21ES22-$500.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-24/06/2026-T1-24/06/2026-T2
CAMB 4A REPETID PROFI TABL 120ABC11ES11-$500.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-24/06/2026-T1-24/06/2026-T2
LIMP QUIMICA TUBOS AGUA (PASIVADO)-$500.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-24/06/2026-T1-24/06/2026-T2
MANTTO SISTEMA COMBUSTIBLE Y QUEMADOR-$--OPEX-INSTRUMENTACIÓN-PREVENTIVO-25/06/2026-T2-25/06/2026-T3
MTTO 6M REGADERA RODILLO SUCCION-$200.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-25/06/2026-T2-25/06/2026-T3
MTTO 6M VALVULAS ON/OFF REGADERA TELA-$--OPEX-INSTRUMENTACIÓN-PREVENTIVO-25/06/2026-T2-25/06/2026-T3
PRUEBAS DE INTERLOCK-$--OPEX-INSTRUMENTACIÓN-CORRECTIVO-25/06/2026-T2-26/06/2026-T1
MTTO 2M PALPADORES PRENSA LODOS 1-$100.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-24/06/2026-T1-24/06/2026-T3
MTTO 2M PALPADORES PRENSA LODOS 2-$100.00-OPEX-INSTRUMENTACIÓN-PREVENTIVO-24/06/2026-T1-24/06/2026-T3
TPM-A-PRED_DESALINEAMIENT_EJE_120BV30 (PRED - INFR)-$500.00-OPEX-PREDICTIVO-CORRECTIVO-23/06/2026-T1-23/06/2026-T2
P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV31 (PRED - INFR)-$500.00-OPEX-PREDICTIVO-CORRECTIVO-23/06/2026-T1-23/06/2026-T2
P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV32 (PRED - INFR)-$500.00-OPEX-PREDICTIVO-CORRECTIVO-23/06/2026-T1-23/06/2026-T2
CAMBIO DE GRASAS Y LUBRICANTES-$7,000.00-OPEX-PREDICTIVO-PREVENTIVO-23/06/2026-T1-23/06/2026-T2
ALINEAMIENTO DE RODILLO SUCCIÓN-$--OPEX-PREDICTIVO-CORRECTIVO-23/06/2026-T1-23/06/2026-T2
TPM-CAMBIO DE PLANCHA TRANSP. DE FARDOS-$1,800.00-OPEX-INFRAESTRUCTURA-CORRECTIVO-22/06/2026-T1-22/06/2026-T2
F TPMR-TANQUE-ROMPE-PURGA-LINEA-PICADURA-$500.00-OPEX-INFRAESTRUCTURA-CORRECTIVO-23/06/2026-T1-23/06/2026-T2
TPM-FALTA GUARDA TORNILLO DE RECHAZO-$1,500.00-OPEX-INFRAESTRUCTURA-CORRECTIVO-23/06/2026-T2-23/06/2026-T3
TPM R CORROSION DE ESTRUCTURA 120RTU151-$4,000.00-OPEX-INFRAESTRUCTURA-CORRECTIVO-22/06/2026-T1-24/06/2026-T2
TPM R CORROSION DE ESTRUCTURA 120RTU152-$4,000.00-OPEX-INFRAESTRUCTURA-CORRECTIVO-24/06/2026-T1-26/06/2026-T3
TPM-CAMBIO DE TUBERIA CONDUIT TECHO MP-$10,500.00-OPEX-INFRAESTRUCTURA-CORRECTIVO-22/06/2026-T1-26/06/2026-T2
LUCERNALIAS DE TECHO DE MP1 CON CORROSIÓN-$83,454.14-OPEX-INFRAESTRUCTURA-CORRECTIVO-22/06/2026-T1-27/06/2026-T3
REPARACIÓN DE TECHO MP1 LADO MEZANINE-$15,000.00-OPEX-INFRAESTRUCTURA-CORRECTIVO-22/06/2026-T1-26/06/2026-T3`;

const loadInitialData = () => {
  const rows = rawDatabase.trim().split('\n');
  return rows.map((row, index) => {
      let cols = row.split('-');
      if (cols.length < 9) return null; 

      const len = cols.length;
      const turnoF = cols[len - 1].trim().toUpperCase();
      const fechaF = cols[len - 2].trim();
      const turnoI = cols[len - 3].trim().toUpperCase();
      const fechaI = cols[len - 4].trim();
      const tipoStr = cols[len - 5].trim();
      const responsable = cols[len - 6].trim().toUpperCase();
      const concepto = cols[len - 7].trim().toUpperCase();
      const montoStr = cols[len - 8].trim();
      const actividad = cols.slice(0, len - 8).join('-').trim();

      const monto = parseFloat(montoStr.replace(/[^0-9.-]/g, '')) || 0;
      const tipo = determineTipo(tipoStr) || 'PREVENTIVO';
      
      const parsedFechaI = fechaI ? fechaI.split('/').reverse().join('-') : '';
      const parsedFechaF = fechaF ? fechaF.split('/').reverse().join('-') : '';

      const newCronograma = {};
      if (parsedFechaI && parsedFechaF) {
          const start = new Date(parsedFechaI + 'T00:00:00');
          const end = new Date(parsedFechaF + 'T00:00:00');
          const shiftsArr = ['T1', 'T2', 'T3'];

          if (start <= end) {
              for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                  const dStr = dt.toISOString().split('T')[0];
                  let dailyShifts = [];
                  if (parsedFechaI === parsedFechaF) {
                      let sIdx = shiftsArr.indexOf(turnoI);
                      let eIdx = shiftsArr.indexOf(turnoF);
                      if (sIdx > eIdx) [sIdx, eIdx] = [eIdx, sIdx]; 
                      dailyShifts = shiftsArr.slice(sIdx, eIdx + 1);
                  } else {
                      if (dStr === parsedFechaI) dailyShifts = shiftsArr.slice(shiftsArr.indexOf(turnoI));
                      else if (dStr === parsedFechaF) dailyShifts = shiftsArr.slice(0, shiftsArr.indexOf(turnoF) + 1);
                      else dailyShifts = [...shiftsArr];
                  }
                  newCronograma[dStr] = dailyShifts;
              }
          }
      }

      return {
          id: index + 1, actividad, monto, concepto, responsable, tipo,
          fechaInicio: parsedFechaI, fechaFin: parsedFechaF, cronograma: newCronograma
      };
  }).filter(Boolean);
};

export default function App() {
  const [data, setData] = useState(loadInitialData());
  const [view, setView] = useState('dashboard');
  const [pasteData, setPasteData] = useState('');
  const [modalOpen, setModalOpen] = useState(null); 
  const [expandedRows, setExpandedRows] = useState(new Set()); 
  
  // Estado para gestión UI (Ocultar/Mostrar Formularios)
  const [showForms, setShowForms] = useState(false);
  // Estado para modo Compacto de Planeación
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  // Estados para Alertas y Confirmaciones
  const [toastMsg, setToastMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
  
  // Estado para planeación (Inicializado en Junio 2026)
  const [planningDate, setPlanningDate] = useState(new Date('2026-06-22T00:00:00'));
  const [filterResponsable, setFilterResponsable] = useState('');
  
  // Referencias para el Scrollbar Superior
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const [formData, setFormData] = useState({
    actividad: '', monto: '', concepto: 'OPEX', responsable: '', tipo: 'PREVENTIVO', fechaInicio: '', fechaFin: '',
    turnoT1: true, turnoT2: true, turnoT3: true
  });

  const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  // --- Auto-limpieza del Toast ---
  useEffect(() => {
    if(toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // --- Lógica de Scrollbar Sincronizado ---
  useEffect(() => {
    if (view === 'planning' && tableScrollRef.current && tableScrollRef.current.firstChild) {
      setTableScrollWidth(tableScrollRef.current.firstChild.scrollWidth);
    }
  }, [view, data, planningDate, expandedRows, filterResponsable, isCompactMode]);

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

  // --- Lógica de Fechas (Gantt) ---
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

  // --- Lógica de Negocio ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddData = (e) => {
    e.preventDefault();
    if (!formData.actividad || !formData.monto) return;

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
      id: Date.now(), actividad: formData.actividad, monto: parseFloat(formData.monto), concepto: formData.concepto.toUpperCase(),
      responsable: formData.responsable.toUpperCase(), tipo: formData.tipo.toUpperCase(),
      fechaInicio: formData.fechaInicio, fechaFin: formData.fechaFin, cronograma: newCronograma
    };
    setData(prev => [newItem, ...prev]);
    setFormData({ actividad: '', monto: '', concepto: 'OPEX', responsable: '', tipo: 'PREVENTIVO', fechaInicio: '', fechaFin: '', turnoT1: true, turnoT2: true, turnoT3: true });
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

  // --- LÓGICA DE PEGADO MASIVO INTELIGENTE ---
  const handlePasteProcess = () => {
    if (!pasteData.trim()) return;
    const rows = pasteData.trim().split('\n');
    const newItems = [];
    let successCount = 0;

    rows.forEach((row, index) => {
        let cols = row.split('\t');
        let isHyphen = false;
        if (cols.length < 2) { 
            cols = row.split('-'); 
            isHyphen = true; 
        }
        if (cols.length < 2) return; 

        let actividad, montoStr, concepto, responsable, tipoStr, fechaI, turnoI, fechaF, turnoF;

        if (isHyphen && cols.length >= 9) {
            const len = cols.length;
            turnoF = cols[len - 1];
            fechaF = cols[len - 2];
            turnoI = cols[len - 3];
            fechaI = cols[len - 4];
            tipoStr = cols[len - 5];
            responsable = cols[len - 6];
            concepto = cols[len - 7];
            montoStr = cols[len - 8];
            actividad = cols.slice(0, len - 8).join('-');
        } else {
            actividad = cols[0];
            montoStr = cols[1];
            concepto = cols[2];
            responsable = cols[3];
            tipoStr = cols[4];
            fechaI = cols[5];
            turnoI = cols[6];
            fechaF = cols[7];
            turnoF = cols[8];
        }

        actividad = actividad?.trim();
        const cleanMontoStr = String(montoStr || '').trim().replace(/[^0-9.-]/g, ''); 
        const monto = parseFloat(cleanMontoStr) || 0;
        concepto = String(concepto || '').trim().toUpperCase() || 'OPEX';
        responsable = String(responsable || '').trim().toUpperCase() || 'GENERAL';
        const tipo = determineTipo(tipoStr) || 'PREVENTIVO';
        
        const parseDate = (dStr) => {
            if (!dStr) return '';
            const match = String(dStr).trim().match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) return `${match[3]}-${match[2]}-${match[1]}`;
            const match2 = String(dStr).trim().match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match2) return match2[0];
            return '';
        };

        const parseShift = (sStr) => {
            if (!sStr) return 'T1';
            const match = String(sStr).trim().match(/T[1-3]/i);
            return match ? match[0].toUpperCase() : 'T1';
        };

        const parsedFechaI = parseDate(fechaI);
        const parsedTurnoI = parseShift(turnoI);
        const parsedFechaF = parseDate(fechaF);
        const parsedTurnoF = parseShift(turnoF);

        const newCronograma = {};
        if (parsedFechaI && parsedFechaF) {
            const start = new Date(parsedFechaI + 'T00:00:00');
            const end = new Date(parsedFechaF + 'T00:00:00');
            const shiftsArr = ['T1', 'T2', 'T3'];

            if (start <= end) {
                for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                    const dStr = dt.toISOString().split('T')[0];
                    let dailyShifts = [];
                    
                    if (parsedFechaI === parsedFechaF) {
                        let sIdx = shiftsArr.indexOf(parsedTurnoI);
                        let eIdx = shiftsArr.indexOf(parsedTurnoF);
                        if (sIdx > eIdx) [sIdx, eIdx] = [eIdx, sIdx]; 
                        dailyShifts = shiftsArr.slice(sIdx, eIdx + 1);
                    } else {
                        if (dStr === parsedFechaI) {
                            dailyShifts = shiftsArr.slice(shiftsArr.indexOf(parsedTurnoI));
                        } else if (dStr === parsedFechaF) {
                            dailyShifts = shiftsArr.slice(0, shiftsArr.indexOf(parsedTurnoF) + 1);
                        } else {
                            dailyShifts = [...shiftsArr];
                        }
                    }
                    newCronograma[dStr] = dailyShifts;
                }
            }
        }

        if (actividad && (monto >= 0 || monto < 0)) {
            newItems.push({
                id: `PASTE-${Date.now()}-${index}`,
                actividad, monto, concepto, responsable, tipo,
                fechaInicio: parsedFechaI, fechaFin: parsedFechaF,
                cronograma: newCronograma
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

  // --- CÁLCULOS ESTADÍSTICOS Y RESPONSABLES ÚNICOS ---
  const uniqueResponsables = useMemo(() => {
    const resps = new Set(data.map(d => d.responsable).filter(Boolean));
    return Array.from(resps).sort(); 
  }, [data]);

  const metrics = useMemo(() => {
    const totalGasto = data.reduce((acc, item) => acc + item.monto, 0);
    const byConcepto = data.reduce((acc, item) => { acc[item.concepto || "OTROS"] = (acc[item.concepto || "OTROS"] || 0) + item.monto; return acc; }, {});
    const byTipo = data.reduce((acc, item) => { acc[item.tipo || "OTRO"] = (acc[item.tipo || "OTRO"] || 0) + item.monto; return acc; }, {});
    const byResponsable = data.reduce((acc, item) => { acc[item.responsable || "SIN ASIGNAR"] = (acc[item.responsable || "SIN ASIGNAR"] || 0) + item.monto; return acc; }, {});
    
    const chartDataConcepto = Object.keys(byConcepto).map(key => ({ name: key, value: byConcepto[key] }));
    const chartDataTipo = Object.keys(byTipo).map(key => ({ name: key, value: byTipo[key] }));
    
    const chartDataResponsable = Object.keys(byResponsable).map(key => ({ name: key, monto: byResponsable[key] })).sort((a, b) => b.monto - a.monto);
    
    const sortedApi = data.filter(d => d.concepto === 'API').sort((a,b) => b.monto - a.monto);
    const sortedOpex = data.filter(d => d.concepto === 'OPEX').sort((a,b) => b.monto - a.monto);

    let planningData = [...data];
    if(filterResponsable) planningData = planningData.filter(d => d.responsable === filterResponsable);
    planningData.sort((a,b) => a.responsable.localeCompare(b.responsable));

    return { totalGasto, chartDataConcepto, chartDataTipo, chartDataResponsable, byConcepto, sortedApi, sortedOpex, planningData };
  }, [data, filterResponsable]);

  const planningDays = useMemo(() => getDaysArray(planningDate, 7), [planningDate]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- TOAST NOTIFICATIONS --- */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-in slide-in-from-bottom-5 flex items-center justify-between min-w-[300px]">
           <span className="font-medium text-sm">{toastMsg}</span>
           <button onClick={() => setToastMsg('')} className="ml-4 text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
      )}

      {/* --- CONFIRM DIALOG MODAL --- */}
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
            <Activity className="text-emerald-400" />
            <span className="text-lg font-semibold tracking-wide text-slate-100">DASHBOARD</span>
          </div>
          <nav className="flex space-x-2">
            <button onClick={() => setView('dashboard')} className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                <LayoutDashboard size={16} className="mr-2"/> Dashboard
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
              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-6 flex items-center"><span className="w-1 h-4 bg-blue-800 mr-2"></span>Distribución (API vs OPEX)</h3>
                {data.length > 0 ? (
                  <div className="h-80 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.chartDataConcepto} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={renderCustomizedLabel} labelLine={true}>
                          {metrics.chartDataConcepto.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.name === 'API' ? COLORS.API : entry.name === 'OPEX' ? COLORS.OPEX : COLORS.IMP} />))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius:'8px'}} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400">Sin datos</div>}
              </Card>

              <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase mb-6 flex items-center"><span className="w-1 h-4 bg-emerald-600 mr-2"></span>Eficiencia (Tipo de OM)</h3>
                {data.length > 0 ? (
                  <div className="h-80 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.chartDataTipo} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={renderCustomizedLabel} labelLine={true}>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card className="p-6 h-[500px] flex flex-col relative">
                 <button onClick={() => setModalOpen('API')} className="absolute top-4 right-4 text-slate-400 hover:text-blue-600 transition-colors p-2 rounded hover:bg-blue-50" title="Ver hoja completa">
                    <Maximize2 size={20} />
                 </button>
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-blue-800 mr-2"></span>Detalle Inversiones (API)</h3>
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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

               <Card className="p-6 h-[500px] flex flex-col relative">
                 <button onClick={() => setModalOpen('OPEX')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded hover:bg-slate-100" title="Ver hoja completa">
                    <Maximize2 size={20} />
                 </button>
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-slate-500 mr-2"></span>Detalle Operativo (OPEX)</h3>
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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

            <Card className="p-6 relative">
              <button onClick={() => setModalOpen('RESP')} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded hover:bg-indigo-50" title="Ver hoja completa">
                 <Maximize2 size={20} />
              </button>
              <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><span className="w-1 h-4 bg-indigo-600 mr-2"></span>Gasto Total por Responsable</h3>
              {data.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.chartDataResponsable} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                      <YAxis tickFormatter={(val)=> `$${val/1000}k`} tick={{fontSize: 12, fill: '#64748b'}} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius:'8px'}} />
                      <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="monto" position="top" formatter={(value) => formatCurrency(value)} style={{ fontSize: '11px', fill: '#475569', fontWeight: 'bold' }} />
                        {metrics.chartDataResponsable.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getResponsableColor(entry.name, uniqueResponsables)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="h-80 flex items-center justify-center text-slate-400">Sin datos</div>}
            </Card>

             {/* Modales Dashboard */}
             <FullScreenModal isOpen={modalOpen === 'API'} onClose={() => setModalOpen(null)} title="Ranking Inversiones (API)" contentId="modal-api">
                <div style={{ height: Math.max(600, metrics.sortedApi.length * 40) }} id="modal-api">
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

             <FullScreenModal isOpen={modalOpen === 'OPEX'} onClose={() => setModalOpen(null)} title="Ranking Gastos (OPEX)" contentId="modal-opex">
                <div style={{ height: Math.max(600, metrics.sortedOpex.length * 40) }} id="modal-opex">
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

             <FullScreenModal isOpen={modalOpen === 'RESP'} onClose={() => setModalOpen(null)} title="Gasto por Responsable" contentId="modal-resp">
                <div className="h-[600px]" id="modal-resp">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataResponsable} margin={{ top: 40, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 14, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tickFormatter={(val)=> formatCurrency(val)} tick={{fontSize: 12, fill: '#64748b'}} width={100}/>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius:'8px'}} />
                        <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="monto" position="top" formatter={(value) => formatCurrency(value)} style={{ fontSize: '14px', fill: '#475569', fontWeight: 'bold' }} />
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
                 
                 {/* Botones de Vista (Detalle vs Compacta) */}
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
                                        const isInRange = isDateInRange(dateKey, item.fechaInicio, item.fechaFin) || shifts.length > 0;
                                        
                                        if (isExpanded) {
                                            if (!isInRange && shifts.length === 0) {
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
                                                        {isInRange ? (
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
                    <div className="flex items-center"><div className="w-4 h-4 bg-blue-500 mr-2 rounded"></div> Periodo General</div>
                    <div className="flex items-center"><div className="w-4 h-4 bg-[#fef08a] border border-yellow-300 mr-2 rounded"></div> Turno Asignado</div>
                    <div className="flex items-center"><div className="w-4 h-4 bg-slate-100 border border-slate-200 mr-2 rounded"></div> Sin Asignar</div>
                </div>
            </Card>
          </div>
        )}

        {/* ================= VISTA: GESTIÓN ================= */}
        {view === 'entry' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            {/* --- Botón para Toglear Formularios --- */}
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
                    <Card className="p-6 bg-blue-50 border-blue-200">
                        <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center uppercase">
                        <Clipboard className="mr-2 text-blue-600" size={18}/> Pegado Masivo Inteligente
                      </h3>
                      <p className="text-xs text-blue-700 mb-3">
                        Copia de Excel y pega. Formato requerido: <br/><b>Actividad - Monto - Concepto - Responsable - Tipo - Fecha_I - Turno_I - Fecha_F - Turno_F</b>
                      </p>
                      <textarea 
                        rows={4} value={pasteData} onChange={(e) => setPasteData(e.target.value)}
                        className="w-full text-xs p-3 rounded border border-blue-200 focus:ring-2 focus:ring-blue-400 mb-3 font-mono"
                        placeholder="MTTO 1A RODILLO - $12,000 - OPEX - MECANICO - PREVENTIVO - 22/06/2026 - T1 - 24/06/2026 - T1"
                      />
                      <button type="button" onClick={handlePasteProcess} className="w-full py-2 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-800 transition shadow-sm">
                          Procesar y Agrupar Datos
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
                            <th className="px-6 py-3 text-right">Monto</th>
                            <th className="px-6 py-3 text-center">Concepto</th>
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
                              <td className="px-6 py-2 text-right font-mono text-slate-600">{formatCurrency(item.monto)}</td>
                              <td className="px-6 py-2 text-center"><span className="text-xs font-bold text-slate-500">{item.concepto}</span></td>
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
                            <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">Base de datos vacía.</td></tr>
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