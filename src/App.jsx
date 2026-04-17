import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell,
  PieChart, Pie, Legend, AreaChart, Area, ComposedChart, Scatter, ScatterChart, ZAxis, Line
} from 'recharts';
import { 
  PlusCircle, Trash2, Activity, LayoutDashboard, Table, CheckCircle, Clipboard, Maximize2, X, Download, Calendar, ChevronLeft, ChevronRight, ChevronDown, Pencil, Maximize, Minimize, Briefcase, Flame, Users, Clock, TrendingUp, Brain, AlertTriangle, Lightbulb, CalendarDays, Filter, Loader2
} from 'lucide-react';

// --- Componentes UI Atómicos (Diseño Minimalista Corporativo) ---

const Card = ({ children, className = "", id }) => (
  <div id={id} className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const KpiCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <Card className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-light tracking-tight text-slate-900 mb-1">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      {subtext && <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>}
    </div>
  </Card>
);

// --- Funciones de Utilidad ---

const FullScreenModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Activity className="mr-2 text-indigo-600" size={20}/>
            {title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-full">
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
    <text x={x} y={y} fill="#475569" textAnchor={textAnchor} dominantBaseline="central" fontSize="10" fontWeight="600">
      {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

// --- Colores Consistentes y Corporativos ---
const RESPONSABLE_COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', 
  '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316', '#ec4899'
];

const getResponsableColor = (name, uniqueList) => {
  const idx = uniqueList.indexOf(name);
  if (idx === -1) return '#94a3b8';
  return RESPONSABLE_COLORS[idx % RESPONSABLE_COLORS.length];
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// --- Base de Datos Interna Estructurada ---
const rawDatabase = `MTTO  SUB ESTACIONES | ELECTRICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO TRAFOS | ELECTRICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 2A PREVENTIVO RED AEREA 22.9KV | ELECTRICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO CORRECTIVO 1A DRIVE DR100 | ELECTRICO | 26/06/2026 | 27/06/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | -
MTTO CORRECTIVO 1A DRIVE DR200 | ELECTRICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 1A MCC1 MP1 | ELECTRICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 1A MCC2 MP1 | ELECTRICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 1A VENTILADORES | ELECTRICO | 26/06/2026 | 27/06/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | -
MTTO 2A BUZONES MT 22.9KV | ELECTRICO | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
PRUEBAS ELECTRICAS CABLES DE MEDIA TENSIÓN | ELECTRICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
TPM-AVERIA LAMPARA DE SEÑALIZACION CCM | ELECTRICO | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
TPM-FALLA MOTOR PERDIDA DE AISLAMIENTO | ELECTRICO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 3M DAMPER CAPOTA MP1 | INSTRUMENTACIÓN | 27/06/2026 | 28/06/2026 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1 | - | - | - | - | - | - | - | - | - | -
MTTO 1A RODILLO SUCCION | MECANICO | 26/06/2026 | 28/06/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1 | - | - | - | - | - | - | - | -
MTTO CAPOTA | MECANICO | 27/06/2026 | 29/06/2026 | 27/06/2026 | T1,T2 | 28/06/2026 | T1,T2 | 29/06/2026 | T1,T2 | - | - | - | - | - | - | - | -
MTTO 1A CILINDRO YANKEE MP1 | MECANICO | 27/06/2026 | 28/06/2026 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | -
MTTO 1A CALDERA 5 | MECANICO | 26/06/2026 | 02/07/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2 | 28/06/2026 | T1,T2 | 29/06/2026 | T1,T2 | 30/06/2026 | T1,T2 | 01/07/2026 | T1,T2 | 02/07/2026 | T1,T2
MTTO 2A POZO AGUA N°05 | MECANICO | 26/06/2026 | 28/06/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | -
MTTO 1A  PULPER PP1 | MECANICO | 26/06/2026 | 02/07/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | 29/06/2026 | T1,T2,T3 | 30/06/2026 | T1,T2,T3 | 01/07/2026 | T1,T2,T3 | 02/07/2026 | T1,T2,T3
TANQUES AIRE - VAPOR | MECANICO | 26/06/2026 | 29/06/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2 | 28/06/2026 | T1,T2 | 29/06/2026 | T1,T2 | - | - | - | - | - | -
RODILLERIA | MECANICO | 28/06/2026 | 29/06/2026 | 28/06/2026 | T1,T2,T3 | 29/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | -
LAVADO QUIMICO BOMBAS VACIO | MECANICO | 26/06/2026 | 26/06/2026 | 26/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
REDUCTORES (Pulper + otros) | MECANICO | 27/06/2026 | 28/06/2026 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | -
MTTO 6M EXTRACTOR VAHO VE-95 MP1 | MECANICO | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
CAMBIO DE ROTOR Y CRIBA DE LA PERA | MECANICO | 27/06/2026 | 28/06/2026 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | -
MANTENIMIENTO VALVULAS | MECANICO | 26/06/2026 | 28/06/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | -
MTTO 2A CILIND HIDRAU LEVANT L.A NIPCOFL (INSPECCION) | MECANICO | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
CAMBIO CHUMACERAS HVAC | MECANICO | 26/06/2026 | 26/06/2026 | 26/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTENIMIENTO CARDANES | MECANICO | 27/06/2026 | 28/06/2026 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | -
TPM-A-PRED_DESGASTE_RODA_CHU_DIABOLO | MECANICO | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 1A DAF PTAR | MECANICO | 28/06/2026 | 28/06/2026 | 28/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 2M/1A CHORRO PASA PUNTA MP1 | MECANICO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 1M CHILLING SHOWER MP1 | MECANICO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 3M SISTEMA MECANICO QCS MP1 | MECANICO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 4M SVECOM MP1 | MECANICO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 4M MECA ENFAJILLADORA MP1 | MECANICO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MONTAJE DE ACOPLE DE BOMBA DE VACIO 32 | MECANICO | 26/06/2026 | 26/06/2026 | 26/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
P TPM-A-PRED AGITADOR 120-AG-11B | MECANICO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
INSPECCION IMPULSOR FAM PUM | MECANICO | 28/06/2026 | 29/06/2026 | 28/06/2026 | T3 | 29/06/2026 | T1 | - | - | - | - | - | - | - | - | - | -
TPM-MTTO CORREC  CALIB. VV REGULADORA GN | MECANICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
CAMBIO DE RECUBRIMIENTO DE RODILLOS - CAVAL | MECANICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
CAMBIO DE ENCHAQUETADO ZONA DE MESANINE | MECANICO | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 5A TANQUE FLASH PTER | MECANICO | 26/06/2026 | 26/06/2026 | 26/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 1A ENSAYOS END QUEMADOR 120-VE-01 | MECANICO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
TPM-A-PRED_DESALINEAMIENT_EJE_120BV30 (PRED - INFR) | PREDICTIVO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV31 (PRED - INFR) | PREDICTIVO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
P TPM-A-PRED_DESALINEAMIENTO_EJE_120BV32 (PRED - INFR) | PREDICTIVO | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
CAMBIO DE GRASAS Y LUBRICANTES | PREDICTIVO | 26/06/2026 | 29/06/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | 29/06/2026 | T1,T2,T3 | - | - | - | - | - | -
ALINEAMIENTO DE RODILLO SUCCIÓN | PREDICTIVO | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
TPM-CAMBIO DE PLANCHA TRANSP. DE FARDOS | INFRAESTRUCTURA | 26/06/2026 | 26/06/2026 | 26/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
F TPMR-TANQUE-ROMPE-PURGA-LINEA-PICADURA | INFRAESTRUCTURA | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
TPM-FALTA GUARDA TORNILLO DE RECHAZO | INFRAESTRUCTURA | 27/06/2026 | 27/06/2026 | 27/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
TPM R CORROSION DE ESTRUCTURA 120RTU151 | INFRAESTRUCTURA | 26/06/2026 | 28/06/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | -
TPM R CORROSION DE ESTRUCTURA 120RTU152 | INFRAESTRUCTURA | 28/06/2026 | 30/06/2026 | 28/06/2026 | T1,T2,T3 | 29/06/2026 | T1,T2,T3 | 30/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | -
TPM-CAMBIO DE TUBERIA CONDUIT TECHO MP | INFRAESTRUCTURA | 26/06/2026 | 30/06/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2 | 28/06/2026 | T1,T2 | 29/06/2026 | T1,T2 | 30/06/2026 | T1,T2 | - | - | - | -
LUCERNALIAS DE TECHO DE MP1 CON CORROSIÓN | INFRAESTRUCTURA | 26/06/2026 | 02/07/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | 29/06/2026 | T1,T2,T3 | 30/06/2026 | T1,T2,T3 | 01/07/2026 | T1,T2,T3 | 02/07/2026 | T1,T2,T3
TPM INST. MEDIDOR DE FLUJO DE GAS | INSTRUMENTACIÓN | 26/06/2026 | 26/06/2026 | 26/06/2026 | T1 | - | - | - | - | - | - | - | - | - | - | - | -
TPM F SERVER SIEMENS EST. CONTROL 1 | INSTRUMENTACIÓN | 26/06/2026 | 27/06/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | -
TPM CALIB MEDIDOR SALIDA VAPOR FIT X4310 | INSTRUMENTACIÓN | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
TPM CALIB. MEDIDOR FLUJO DE VAPOR FT 516 | INSTRUMENTACIÓN | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
TPM. MIGRACION SIST. DE CONTROL | INSTRUMENTACIÓN | 26/06/2026 | 28/06/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | -
MANTTO ROTAMETRO DEL ABLANDADOR | INSTRUMENTACIÓN | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO SIST TANQUE CONDENSADO CALDERA | INSTRUMENTACIÓN | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO MENSUAL DE SENSORES | INSTRUMENTACIÓN | 27/06/2026 | 27/06/2026 | 27/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO PREVENTIVO PISTONES NEUMATICO | INSTRUMENTACIÓN | 27/06/2026 | 27/06/2026 | 27/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO SEMESTRAL TABLEROS NEUMATICOS PP1 | INSTRUMENTACIÓN | 27/06/2026 | 27/06/2026 | 27/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO SEMESTRAL SISTEMA PESAJE PULPER | INSTRUMENTACIÓN | 26/06/2026 | 28/06/2026 | 26/06/2026 | T1,T2 | 27/06/2026 | T1,T2 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | -
TRABAJOS VARIOS EN INSTRUMENTACIÓN | INSTRUMENTACIÓN | 27/06/2026 | 28/06/2026 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | -
MANTENIMIENTO PREVENTIVO PISTON NEUMATIC | INSTRUMENTACIÓN | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO 6M VALVULA CONTROL | INSTRUMENTACIÓN | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO MENSUAL DE SENSORES | INSTRUMENTACIÓN | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO MENSUAL DE SENSORES | INSTRUMENTACIÓN | 29/06/2026 | 29/06/2026 | 29/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
CAMB 4A REPETID PROFI TABL 120ABC21ES22 | INSTRUMENTACIÓN | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
CAMB 4A REPETID PROFI TABL 120ABC11ES11 | INSTRUMENTACIÓN | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
LIMP QUIMICA TUBOS AGUA (PASIVADO) | INSTRUMENTACIÓN | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2 | - | - | - | - | - | - | - | - | - | - | - | -
MANTTO SISTEMA COMBUSTIBLE Y QUEMADOR | INSTRUMENTACIÓN | 29/06/2026 | 29/06/2026 | 29/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 6M REGADERA RODILLO SUCCION | INSTRUMENTACIÓN | 29/06/2026 | 29/06/2026 | 29/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 6M VALVULAS ON/OFF REGADERA TELA | INSTRUMENTACIÓN | 29/06/2026 | 29/06/2026 | 29/06/2026 | T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
PRUEBAS DE INTERLOCK | INSTRUMENTACIÓN | 29/06/2026 | 30/06/2026 | 29/06/2026 | T2,T3 | 30/06/2026 | T1 | - | - | - | - | - | - | - | - | - | -
MTTO 2M PALPADORES PRENSA LODOS 1 | INSTRUMENTACIÓN | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
MTTO 2M PALPADORES PRENSA LODOS 2 | INSTRUMENTACIÓN | 28/06/2026 | 28/06/2026 | 28/06/2026 | T1,T2,T3 | - | - | - | - | - | - | - | - | - | - | - | -
REPARACIÓN DE TECHO MP1 LADO MEZANINE | INFRAESTRUCTURA | 26/06/2026 | 30/06/2026 | 26/06/2026 | T1,T2,T3 | 27/06/2026 | T1,T2,T3 | 28/06/2026 | T1,T2,T3 | 29/06/2026 | T1,T2,T3 | 30/06/2026 | T1,T2,T3 | - | - | - | -`;

const loadInitialData = () => {
  const rows = rawDatabase.trim().split('\n');
  return rows.map((row, index) => {
      if (!row.trim()) return null;
      let parts = row.split(' | ');
      if (parts.length < 4) return null; 

      const actividad = parts[0].trim();
      const responsable = parts[1].trim();
      const fechaI_str = parts[2].trim();
      const fechaF_str = parts[3].trim();

      const parseDate = (dStr) => {
          if (!dStr) return '';
          const match = String(dStr).trim().match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (match) return `${match[3]}-${match[2]}-${match[1]}`;
          const match2 = String(dStr).trim().match(/(\d{4})-(\d{2})-(\d{2})/);
          if (match2) return match2[0];
          return '';
      };

      const parsedFechaI = parseDate(fechaI_str);
      const parsedFechaF = parseDate(fechaF_str);

      const newCronograma = {};
      
      for (let i = 4; i < parts.length; i += 2) {
          const dayStr = (parts[i] || '').trim();
          const shiftsStr = (parts[i + 1] || '').trim();

          if (dayStr === '-' || dayStr === '') break;

          const d = parseDate(dayStr);
          if (d && shiftsStr && shiftsStr !== '-') {
              const shifts = shiftsStr.split(',').map(s => s.trim().toUpperCase()).filter(s => s.match(/^T[1-3]$/));
              if (shifts.length > 0) {
                  newCronograma[d] = shifts;
              }
          }
      }

      return {
          id: index + 1, actividad, responsable,
          fechaInicio: parsedFechaI, fechaFin: parsedFechaF, cronograma: newCronograma
      };
  }).filter(Boolean);
};

export default function App() {
  const [data, setData] = useState(loadInitialData());
  const [view, setView] = useState('planning');
  const [pasteData, setPasteData] = useState('');
  const [modalOpen, setModalOpen] = useState(null); 
  const [expandedRows, setExpandedRows] = useState(new Set()); 
  
  // Estado para gestión UI
  const [showForms, setShowForms] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Alertas
  const [toastMsg, setToastMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
  
  // Planeación y Vista de Calendario
  const [planningDate, setPlanningDate] = useState(new Date('2026-06-26T00:00:00'));
  const [viewRange, setViewRange] = useState(7); 
  const [filterResponsable, setFilterResponsable] = useState('');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  
  // Scroll Sync
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
  }, [view, data, planningDate, viewRange, expandedRows, filterResponsable, isCompactMode]);

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

  const handleResponsableClick = (responsable) => {
      if (!responsable) return;
      setFilterResponsable(responsable);
      setView('planning');
      setModalOpen(null); 
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
      id: Date.now(), actividad: formData.actividad,
      responsable: formData.responsable.toUpperCase(),
      fechaInicio: formData.fechaInicio, fechaFin: formData.fechaFin, cronograma: newCronograma
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
        if (!row.trim()) return;
        
        const parts = row.split(' | ');
        
        if (parts.length < 4) return; 

        const actividad_str = parts[0].trim();
        const responsable_str = parts[1].trim();
        const fechaI_str = parts[2].trim();
        const fechaF_str = parts[3].trim();

        const parseDate = (dStr) => {
            if (!dStr) return '';
            const match = String(dStr).trim().match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) return `${match[3]}-${match[2]}-${match[1]}`;
            const match2 = String(dStr).trim().match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match2) return match2[0];
            return '';
        };

        const parsedFechaI = parseDate(fechaI_str);
        const parsedFechaF = parseDate(fechaF_str);

        const newCronograma = {};
        
        for (let i = 4; i < parts.length; i += 2) {
            const dayStr = (parts[i] || '').trim();
            const shiftsStr = (parts[i + 1] || '').trim();

            if (dayStr === '-' || dayStr === '') break;

            const d = parseDate(dayStr);
            if (d && shiftsStr && shiftsStr !== '-') {
                const shifts = shiftsStr.split(',').map(s => s.trim().toUpperCase()).filter(s => s.match(/^T[1-3]$/));
                if (shifts.length > 0) {
                    newCronograma[d] = shifts;
                }
            }
        }

        if (actividad_str && parsedFechaI && parsedFechaF) {
            newItems.push({
                id: `PASTE-${Date.now()}-${index}`,
                actividad: actividad_str, 
                responsable: responsable_str || 'GENERAL',
                fechaInicio: parsedFechaI, 
                fechaFin: parsedFechaF,
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
        setToastMsg("Error al leer datos. Verifica el formato.");
    }
  };

  const handleExportPNG = async () => {
    const container = document.getElementById('gantt-chart-container');
    const tableWrapper = document.getElementById('gantt-table-wrapper');
    
    if (!container || !tableWrapper) {
      setToastMsg("No se encontró el contenedor para exportar.");
      return;
    }

    setIsExporting(true);
    setToastMsg("Preparando la exportación. Por favor, espere...");

    try {
      // Inyectar html2canvas de forma nativa e inteligente si no existe
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(script);
        await new Promise((resolve, reject) => { 
            script.onload = resolve; 
            script.onerror = () => reject(new Error("Fallo al cargar html2canvas"));
        });
      }

      // Guardar estilos originales para restaurarlos luego de la foto
      const originalOverflow = tableWrapper.style.overflow;
      const originalWidth = tableWrapper.style.width;

      // Expandir forzosamente el scroll temporalmente para tomar la captura completa
      tableWrapper.style.overflow = 'visible';
      tableWrapper.style.width = 'max-content';

      const canvas = await window.html2canvas(container, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Restaurar el diseño web normal
      tableWrapper.style.overflow = originalOverflow;
      tableWrapper.style.width = originalWidth;

      const link = document.createElement('a');
      link.download = `Cronograma_MTTO_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setToastMsg("¡Exportación a PNG completada con éxito!");
    } catch (error) {
      console.error("Error exporting to PNG:", error);
      setToastMsg("Hubo un error al exportar la imagen. Intenta nuevamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const uniqueResponsables = useMemo(() => {
    const resps = new Set(data.map(d => d.responsable).filter(Boolean));
    return Array.from(resps).sort(); 
  }, [data]);

  const planningDays = useMemo(() => getDaysArray(planningDate, viewRange), [planningDate, viewRange]);

  const metrics = useMemo(() => {
    const byResponsable = data.reduce((acc, item) => { acc[item.responsable || "SIN ASIGNAR"] = (acc[item.responsable || "SIN ASIGNAR"] || 0) + 1; return acc; }, {});
    const chartDataResponsable = Object.keys(byResponsable).map(key => ({ name: key, count: byResponsable[key] })).sort((a, b) => b.count - a.count);
    
    const esfuerzoPorResponsable = {};
    const duracionPromedioPorArea = {};

    data.forEach(d => {
        let totalTurnos = 0;
        Object.values(d.cronograma || {}).forEach(shifts => totalTurnos += shifts.length);
        const resp = d.responsable || "SIN ASIGNAR";
        esfuerzoPorResponsable[resp] = (esfuerzoPorResponsable[resp] || 0) + totalTurnos;

        const start = new Date(d.fechaInicio + 'T00:00:00');
        const end = new Date(d.fechaFin + 'T00:00:00');
        const days = (d.fechaInicio && d.fechaFin) ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 0;
        if (!duracionPromedioPorArea[resp]) duracionPromedioPorArea[resp] = { total: 0, count: 0 };
        duracionPromedioPorArea[resp].total += days;
        duracionPromedioPorArea[resp].count += 1;
    });

    const chartDataEsfuerzo = Object.keys(esfuerzoPorResponsable).map(k => ({ name: k, turnos: esfuerzoPorResponsable[k] })).sort((a,b) => b.turnos - a.turnos);

    const advancedScatterData = Object.keys(byResponsable).map(k => ({
        area: k,
        actividades: byResponsable[k],
        promedioDias: Number((duracionPromedioPorArea[k].total / duracionPromedioPorArea[k].count).toFixed(1)),
        esfuerzoTotal: esfuerzoPorResponsable[k]
    }));

    let corto = 0, medio = 0, largo = 0;
    data.forEach(d => {
        const start = new Date(d.fechaInicio + 'T00:00:00');
        const end = new Date(d.fechaFin + 'T00:00:00');
        const days = (d.fechaInicio && d.fechaFin) ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 0;
        if (days <= 1) corto++;
        else if (days <= 3) medio++;
        else largo++;
    });
    const chartDataDuracionCat = [
        { name: '1 Día (Cortas)', count: corto, fill: '#10b981' },
        { name: '2-3 Días (Medianas)', count: medio, fill: '#f59e0b' },
        { name: '>3 Días (Largas)', count: largo, fill: '#ef4444' }
    ].filter(i => i.count > 0);

    const chartDataCargaDiaria = planningDays.map(day => {
        const dateKey = formatDateKey(day);
        let activas = 0;
        data.forEach(d => {
            const shifts = (d.cronograma || {})[dateKey] || [];
            const isInRange = isDateInRange(dateKey, d.fechaInicio, d.fechaFin) || shifts.length > 0;
            if (isInRange) activas++;
        });
        return { 
            name: day.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }), 
            actividades: activas 
        };
    });

    let t1 = 0, t2 = 0, t3 = 0;
    data.forEach(item => {
        Object.values(item.cronograma || {}).forEach(shifts => {
            if (shifts.includes('T1')) t1++;
            if (shifts.includes('T2')) t2++;
            if (shifts.includes('T3')) t3++;
        });
    });
    const chartDataTurnos = [
        { name: 'T1 (Mañana)', count: t1, fill: '#3b82f6' },
        { name: 'T2 (Tarde)', count: t2, fill: '#f59e0b' },
        { name: 'T3 (Noche)', count: t3, fill: '#10b981' }
    ].filter(t => t.count > 0);

    const chartDataDuracion = data.map(d => {
        const start = new Date(d.fechaInicio + 'T00:00:00');
        const end = new Date(d.fechaFin + 'T00:00:00');
        const days = d.fechaInicio && d.fechaFin ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 0;
        return { name: d.actividad, dias: days, resp: d.responsable };
    }).sort((a, b) => b.dias - a.dias).slice(0, 5);

    let planningData = [...data];
    
    // Filtrar por Área / Responsable
    if(filterResponsable) {
      planningData = planningData.filter(d => d.responsable === filterResponsable);
    }

    // Filtrar por Ruta Crítica (La Tarea más Larga de todo el set de datos)
    if (showCriticalPath && planningData.length > 0) {
        let maxDuration = -1;
        planningData.forEach(d => {
            if(d.fechaInicio && d.fechaFin) {
                const start = new Date(d.fechaInicio + 'T00:00:00');
                const end = new Date(d.fechaFin + 'T00:00:00');
                const duration = (end - start) / (1000 * 60 * 60 * 24);
                if (duration > maxDuration) maxDuration = duration;
            }
        });
        if (maxDuration >= 0) {
            planningData = planningData.filter(d => {
                if(!d.fechaInicio || !d.fechaFin) return false;
                const start = new Date(d.fechaInicio + 'T00:00:00');
                const end = new Date(d.fechaFin + 'T00:00:00');
                const duration = (end - start) / (1000 * 60 * 60 * 24);
                return duration === maxDuration;
            });
        }
    }

    planningData.sort((a,b) => a.responsable.localeCompare(b.responsable));

    return { 
      chartDataResponsable, 
      chartDataEsfuerzo, 
      chartDataDuracionCat, 
      chartDataCargaDiaria, 
      chartDataDuracion, 
      chartDataTurnos, 
      planningData,
      advancedScatterData 
    };
  }, [data, filterResponsable, showCriticalPath, planningDays]);

  const insights = useMemo(() => {
    const list = [];
    if (data.length === 0) return [];
    
    const areas = metrics.chartDataResponsable;
    if (areas.length > 0 && areas[0].count > data.length * 0.4) {
      list.push({ type: 'danger', text: `Sobrecarga crítica en área ${areas[0].name}. Concentra el ${((areas[0].count/data.length)*100).toFixed(0)}% de las tareas.` });
    }

    const longTasks = data.filter(d => {
      const start = new Date(d.fechaInicio + 'T00:00:00');
      const end = new Date(d.fechaFin + 'T00:00:00');
      return ((end - start) / (1000 * 60 * 60 * 24)) > 3;
    });
    if (longTasks.length > 5) {
      list.push({ type: 'warning', text: `Se detectaron ${longTasks.length} actividades de larga duración (>3 días). Riesgo de retraso acumulado.` });
    }

    const maxDensityDay = [...metrics.chartDataCargaDiaria].sort((a,b) => b.actividades - a.actividades)[0];
    if (maxDensityDay && maxDensityDay.actividades > 10) {
      list.push({ type: 'warning', text: `Pico operativo detectado el ${maxDensityDay.name}. Se requieren medidas de control de tráfico y permisos.` });
    }

    list.push({ type: 'info', text: "Mejora: Digitalizar la liberación de permisos para reducir tiempos muertos en el inicio de turno (T1)." });
    list.push({ type: 'info', text: "Oportunidad: El área de INSTRUMENTACIÓN tiene baja carga; se sugiere apoyo en inspecciones visuales de INFRAESTRUCTURA." });

    return list;
  }, [data, metrics]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- TOAST NOTIFICATIONS --- */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-in slide-in-from-bottom-5 flex items-center justify-between min-w-[300px] border border-slate-700">
           <span className="font-medium text-sm">{toastMsg}</span>
           <button onClick={() => setToastMsg('')} className="ml-4 text-slate-400 hover:text-white transition-colors"><X size={18}/></button>
        </div>
      )}

      {/* --- CONFIRM DIALOG MODAL --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
             <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Acción</h3>
             <p className="text-slate-500 mb-8 text-sm">{confirmDialog.message}</p>
             <div className="flex justify-end space-x-3">
               <button onClick={() => setConfirmDialog({...confirmDialog, isOpen: false})} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancelar</button>
               <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({...confirmDialog, isOpen: false}); }} className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm text-sm">Sí, eliminar</button>
             </div>
          </div>
        </div>
      )}

      {/* HEADER CORPORATIVO MINIMALISTA */}
      <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
                <Activity className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Dashboard Paradas MTTO</span>
          </div>
          <nav className="flex space-x-1 overflow-x-auto no-scrollbar">
            <button onClick={() => setView('planning')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === 'planning' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <CalendarDays size={16} className="mr-2"/> Planeación
            </button>
            <button onClick={() => setView('dashboard')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <LayoutDashboard size={16} className="mr-2"/> General
            </button>
            <button onClick={() => setView('analysis')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === 'analysis' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Brain size={16} className="mr-2"/> Análisis
            </button>
            <button onClick={() => setView('entry')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === 'entry' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Table size={16} className="mr-2"/> Gestión
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-full print:p-0 print:m-0">
        
        {/* ================= VISTA: DASHBOARD ================= */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end pb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Resumen de Actividades Generales</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard title="Total Programado" value={data.length} subtext="Actividades activas" icon={Briefcase} colorClass="text-indigo-600 bg-indigo-50" borderClass="border-transparent" />
              <KpiCard title="Centros de Costo" value={uniqueResponsables.length} subtext="Especialidades involucradas" icon={Users} colorClass="text-emerald-600 bg-emerald-50" borderClass="border-transparent" />
              <KpiCard title="Ventana Operativa" value={`${viewRange} Días`} subtext="Rango de planeación activo" icon={Calendar} colorClass="text-sky-600 bg-sky-50" borderClass="border-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 relative">
                <button onClick={() => setModalOpen('RESP')} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50" title="Ver hoja completa">
                   <Maximize2 size={18} />
                </button>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Actividades Asignadas por Equipo</h3>
                {data.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataResponsable} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} interval={0} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(value) => [value, 'Actividades']} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={(data) => handleResponsableClick(data.name)} style={{cursor: 'pointer'}}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: '10px', fill: '#475569', fontWeight: '600' }} />
                          {metrics.chartDataResponsable.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getResponsableColor(entry.name, uniqueResponsables)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-80 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>}
              </Card>

              <Card className="p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Top 5 Cuellos de Botella (Mayor Duración)</h3>
                {metrics.chartDataDuracion.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataDuracion} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" width={180} tick={{fontSize: 10, fill: '#475569'}} interval={0} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(value, name, props) => [`${value} Días`, `Resp: ${props.payload.resp}`]} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="dias" radius={[0, 6, 6, 0]} fill="#f43f5e" barSize={24} onClick={(data) => handleResponsableClick(data.resp)} style={{cursor: 'pointer'}}>
                          <LabelList dataKey="dias" position="right" formatter={(val) => `${val} d`} style={{ fontSize: '10px', fill: '#475569', fontWeight: '600' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-80 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>}
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6" title="Total de turnos ejecutados">
                  Esfuerzo Operativo (Total Turnos)
                </h3>
                {metrics.chartDataEsfuerzo.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataEsfuerzo} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} interval={0} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(value) => [value, 'Turnos Asignados']} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="turnos" radius={[6, 6, 0, 0]} onClick={(data) => handleResponsableClick(data.name)} style={{cursor: 'pointer'}}>
                          <LabelList dataKey="turnos" position="top" style={{ fontSize: '10px', fill: '#475569', fontWeight: '600' }} />
                          {metrics.chartDataEsfuerzo.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getResponsableColor(entry.name, uniqueResponsables)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-80 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>}
              </Card>

              <Card className="p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Complejidad por Duración</h3>
                  {metrics.chartDataDuracionCat.length > 0 ? (
                    <div className="h-80 w-full flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={metrics.chartDataDuracionCat} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="count" label={renderCustomizedLabel} labelLine={false} stroke="none">
                            {metrics.chartDataDuracionCat.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div className="h-80 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>}
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Densidad Simultánea ({viewRange} Días)</h3>
                </div>
                {metrics.chartDataCargaDiaria.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.chartDataCargaDiaria} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorActividades" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="actividades" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorActividades)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>}
              </Card>

              <Card className="p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Proporción Operativa por Turnos</h3>
                  {metrics.chartDataTurnos.length > 0 ? (
                    <div className="h-72 w-full flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={metrics.chartDataTurnos} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="count" label={renderCustomizedLabel} labelLine={false} stroke="none">
                            {metrics.chartDataTurnos.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>}
              </Card>
            </div>

             <FullScreenModal isOpen={modalOpen === 'RESP'} onClose={() => setModalOpen(null)} title="Actividades por Responsable">
                <div className="h-[600px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.chartDataResponsable} margin={{ top: 40, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} width={50} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={(data) => handleResponsableClick(data.name)} style={{cursor: 'pointer'}}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: '12px', fill: '#475569', fontWeight: '600' }} />
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

        {/* ================= VISTA: ANÁLISIS SENIOR ================= */}
        {view === 'analysis' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end pb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <Brain className="text-indigo-600" size={28} /> Análisis Senior Operativo
                </h2>
                <p className="text-slate-500 text-sm mt-1">Detección de cuellos de botella y optimización mediante IA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center">
                    <Lightbulb size={16} className="mr-2 text-amber-500" /> Insights y Mejoras
                  </h3>
                </div>
                <div className="p-5 flex-1 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar">
                  {insights.length > 0 ? insights.map((insight, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex gap-3 ${
                      insight.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                      insight.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                      'bg-indigo-50 border-indigo-100 text-indigo-800'
                    }`}>
                      <div className="shrink-0 mt-0.5">
                        {insight.type === 'danger' ? <AlertTriangle size={16}/> : 
                         insight.type === 'warning' ? <AlertTriangle size={16}/> : 
                         <CheckCircle size={16}/>}
                      </div>
                      <p className="text-xs font-medium leading-relaxed">{insight.text}</p>
                    </div>
                  )) : <div className="text-center py-10 text-slate-400 text-sm">Insuficientes datos para el algoritmo.</div>}
                </div>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Matriz de Complejidad por Área</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="actividades" name="Cant. Actividades" unit=" act" tick={{fontSize: 11}} axisLine={false} tickLine={false} label={{ value: 'Volumen de Tareas', position: 'bottom', fontSize: 10, offset: 0, fill:'#64748b' }} />
                        <YAxis type="number" dataKey="promedioDias" name="Promedio Días" unit=" d" tick={{fontSize: 11}} axisLine={false} tickLine={false} label={{ value: 'Duración Promedio', angle: -90, position: 'insideLeft', fontSize: 10, fill:'#64748b' }} />
                        <ZAxis type="number" dataKey="esfuerzoTotal" range={[100, 800]} name="Esfuerzo (Turnos)" />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white p-4 shadow-lg rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-800 uppercase mb-2">{d.area}</p>
                                <p className="text-[11px] text-slate-500 mb-1">Tareas: <span className="font-semibold text-slate-800">{d.actividades}</span></p>
                                <p className="text-[11px] text-slate-500 mb-1">Promedio: <span className="font-semibold text-slate-800">{d.promedioDias} días</span></p>
                                <p className="text-[11px] text-slate-500">Esfuerzo: <span className="font-semibold text-slate-800">{d.esfuerzoTotal} turnos</span></p>
                              </div>
                            );
                          }
                          return null;
                        }} />
                        <Scatter name="Áreas" data={metrics.advancedScatterData}>
                          {metrics.advancedScatterData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getResponsableColor(entry.area, uniqueResponsables)} fillOpacity={0.8} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-2">
                    <p className="text-[10px] text-slate-400">El tamaño del círculo representa el esfuerzo total (Turnos operados)</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Correlación: Volumen vs Complejidad</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={metrics.advancedScatterData} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false}/>
                        <XAxis dataKey="area" tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{fontSize: 10, fill:'#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill:'#64748b'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar yAxisId="left" dataKey="actividades" fill="#e2e8f0" radius={[4,4,0,0]} barSize={30} name="Total Tareas" />
                        <Line yAxisId="right" type="monotone" dataKey="promedioDias" stroke="#10b981" strokeWidth={3} name="Promedio Días" dot={{r: 4, strokeWidth:2}} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6 bg-[#0f172a] border-none shadow-xl">
                 <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-6 flex items-center">
                   <Flame size={16} className="mr-2"/> Radar de Riesgo: Top Tareas Prolongadas
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.chartDataDuracion.map((task, i) => (
                      <div key={i} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-rose-500/50 transition-all cursor-pointer group" onClick={() => handleResponsableClick(task.resp)}>
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Riesgo Nivel {i+1}</span>
                           <span className="text-[10px] font-semibold text-slate-400 uppercase">{task.resp}</span>
                        </div>
                        <p className="text-sm font-semibold text-white mb-4 line-clamp-2 leading-snug">{task.actividad}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                          <div className="flex items-center text-slate-300">
                             <Clock size={14} className="mr-1.5"/> <span className="text-xs font-medium">{task.dias} Días</span>
                          </div>
                          <ChevronRight size={16} className="text-slate-500 group-hover:text-rose-400 transition-colors"/>
                        </div>
                      </div>
                    ))}
                 </div>
              </Card>
            </div>
          </div>
        )}

        {/* ================= VISTA: PLANEACIÓN GANTT ================= */}
        {view === 'planning' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            <Card className="p-4 print:hidden">
               <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                   <CalendarDays className="mr-3 text-indigo-600 w-6 h-6" /> Cronograma de Ejecución
                 </h2>
                 
                 <div className="flex flex-wrap items-center gap-2">
                    
                    {/* CONTROL DE FECHA DE INICIO */}
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 px-2">Inicio:</span>
                      <input 
                        type="date" 
                        value={planningDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) setPlanningDate(new Date(e.target.value + 'T00:00:00'));
                        }}
                        className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:border-indigo-300 transition-colors"
                      />
                    </div>

                    {/* CONTROL DE RANGO (1 o 2 Semanas) */}
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button 
                          onClick={() => setViewRange(7)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewRange === 7 ? 'bg-white shadow-sm text-indigo-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                          1 Semana
                        </button>
                        <button 
                          onClick={() => setViewRange(14)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewRange === 14 ? 'bg-white shadow-sm text-indigo-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                          2 Semanas
                        </button>
                    </div>

                    {/* VISTA COMPACTA/DETALLADA */}
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button 
                          onClick={() => setIsCompactMode(false)}
                          className={`flex items-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${!isCompactMode ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                          title="Vista Detallada"
                        >
                          <Maximize size={14} />
                        </button>
                        <button 
                          onClick={() => setIsCompactMode(true)}
                          className={`flex items-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isCompactMode ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                          title="Vista Compacta"
                        >
                          <Minimize size={14} />
                        </button>
                    </div>

                    {/* BOTÓN FILTROS DESPLEGABLES (RENOMBRADO A "ÁREAS" EN VERDE AGUA / TEAL) */}
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${showFilters || filterResponsable ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}
                    >
                      <Filter size={14} className="mr-2"/> Áreas {filterResponsable && <span className="ml-1.5 flex h-2 w-2 rounded-full bg-white"></span>}
                    </button>
                    
                    {/* BOTÓN RUTA CRÍTICA */}
                    <button 
                        onClick={() => setShowCriticalPath(!showCriticalPath)}
                        className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm border ${showCriticalPath ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        title="Resaltar las tareas de mayor duración"
                    >
                        <Flame size={14} className="mr-1.5"/> Ruta Crítica
                    </button>

                    {/* EXPORTAR A PNG */}
                    <button 
                      onClick={handleExportPNG} 
                      disabled={isExporting}
                      className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                    >
                      {isExporting ? <Loader2 size={14} className="mr-2 animate-spin"/> : <Download size={14} className="mr-2"/>}
                      {isExporting ? 'Exportando...' : 'Exportar a PNG'}
                    </button>
                 </div>
               </div>

               {/* PANEL DE ÁREAS DESPLEGABLE */}
               {showFilters && (
                 <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Seleccionar Área / Responsable</span>
                        <div className="flex w-full bg-slate-50 p-2 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar gap-2">
                            <button 
                                onClick={() => setFilterResponsable('')}
                                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterResponsable === '' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-100'}`}
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
                                        className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 whitespace-nowrap ${isActive ? 'bg-white shadow-md border-b-2' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                                        style={isActive ? { color: color, borderColor: color } : {}}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                                        <span>{resp}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                 </div>
               )}
            </Card>

            <Card id="gantt-chart-container" className="overflow-hidden border-none shadow-lg gantt-print-area bg-white">
                
                {/* NAVEGACIÓN INTEGRADA EN EL GANTT (MESES ARRIBA) */}
                <div className="bg-white p-3 border-b border-slate-100 flex flex-col xl:flex-row items-center justify-between gap-4">
                    {/* MESES OPERATIVOS CON DISEÑO VISUAL MEJORADO */}
                    <div className="flex w-full xl:w-auto bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar shadow-inner gap-1">
                        {MONTHS.map((m, index) => {
                            const isActive = planningDate.getMonth() === index;
                            return (
                                <button 
                                    key={m} 
                                    onClick={() => handleMonthClick(index)}
                                    className={`flex-1 min-w-[55px] px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-300 text-center ${isActive ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/80'}`}
                                >
                                    {m}
                                </button>
                            )
                        })}
                    </div>

                    {/* NAVEGACIÓN DIARIA */}
                    <div className="flex w-full xl:w-auto items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <button 
                          onClick={() => { const d = new Date(planningDate); d.setDate(d.getDate() - viewRange); setPlanningDate(d); }} 
                          className="flex items-center px-3 py-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 text-xs font-bold"
                        >
                          <ChevronLeft size={16} className="mr-1"/> {viewRange} D
                        </button>
                        <div className="px-4 py-1 font-semibold text-slate-800 text-sm whitespace-nowrap">
                            {planningDays[0].toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })} <span className="text-slate-400 mx-2">→</span> {planningDays[planningDays.length - 1].toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <button 
                          onClick={() => { const d = new Date(planningDate); d.setDate(d.getDate() + viewRange); setPlanningDate(d); }} 
                          className="flex items-center px-3 py-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 text-xs font-bold"
                        >
                          {viewRange} D <ChevronRight size={16} className="ml-1"/>
                        </button>
                    </div>
                </div>

                <div 
                    ref={topScrollRef} 
                    onScroll={handleTopScroll} 
                    className="overflow-x-auto w-full custom-scrollbar bg-slate-50 border-b border-slate-200 print:hidden"
                    style={{ height: '8px' }}
                >
                    <div style={{ width: tableScrollWidth, height: '1px' }}></div>
                </div>

                <div 
                    id="gantt-table-wrapper"
                    ref={tableScrollRef} 
                    onScroll={handleTableScroll}
                    className="overflow-x-auto w-full custom-scrollbar bg-white"
                >
                   <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr>
                            <th className={`bg-white border-b border-r border-slate-100 sticky left-0 z-20 shadow-[4px_0_12px_rgba(0,0,0,0.03)] align-bottom ${isCompactMode ? 'p-3 min-w-[220px] max-w-[220px]' : 'p-4 min-w-[320px] max-w-[320px]'}`}>
                                <div className={`font-bold text-slate-400 uppercase tracking-widest ${isCompactMode ? 'text-[9px] mb-1' : 'text-[10px] mb-2'}`}>
                                    Línea de Tiempo
                                </div>
                                <span className={`font-semibold text-slate-800 ${isCompactMode ? 'text-xs' : 'text-sm'}`}>Actividad & Responsable</span>
                            </th>
                            {planningDays.map((day, i) => (
                                <th key={i} className={`bg-slate-50/50 border-b border-r border-slate-100 text-center p-0 align-bottom ${isCompactMode ? (viewRange === 14 ? 'min-w-[45px]' : 'min-w-[70px]') : (viewRange === 14 ? 'min-w-[80px]' : 'min-w-[120px]')}`}>
                                    <div className={`h-full flex flex-col justify-center ${isCompactMode ? 'py-2' : 'py-3'}`}>
                                        <span className={`font-bold text-slate-400 uppercase tracking-wider ${isCompactMode ? 'text-[8px] block' : 'text-[10px] block'}`}>
                                            {day.toLocaleDateString('es-CO', { weekday: 'short' })}
                                        </span>
                                        <span className={`text-slate-800 font-bold ${isCompactMode ? 'text-xs mt-0.5 block' : 'text-lg mt-1 block'}`}>
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
                                <tr key={item.id} className="hover:bg-slate-50/80 border-b border-slate-100 transition-colors group">
                                    <td 
                                      className={`border-r border-slate-100 bg-white sticky left-0 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.03)] cursor-pointer group-hover:bg-slate-50/80 ${isCompactMode ? 'p-2' : 'p-4'}`}
                                      onClick={() => toggleRowExpanded(item.id)}
                                      title="Clic para expandir/contraer turnos"
                                    >
                                        <div className={`flex ${isCompactMode ? 'items-center' : 'items-start'}`}>
                                            <button className={`text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50 ${isCompactMode ? 'mr-2' : 'mr-3 p-1 mt-0.5'}`}>
                                                {isExpanded ? <ChevronDown size={isCompactMode ? 14 : 18}/> : <ChevronRight size={isCompactMode ? 14 : 18}/>}
                                            </button>
                                            <div className={`flex-1 min-w-0 ${isCompactMode ? 'flex items-center justify-between gap-3' : ''}`}>
                                                <div className={`font-semibold text-slate-800 truncate ${isCompactMode ? 'text-[10px]' : 'text-xs mb-1.5'}`} title={item.actividad}>
                                                    {item.actividad}
                                                </div>
                                                <div className={`flex items-center shrink-0 ${!isCompactMode ? 'mt-1' : ''}`}>
                                                    <span className={`text-white px-2 py-0.5 rounded-md font-semibold shadow-sm ${isCompactMode ? 'text-[8px] whitespace-nowrap' : 'text-[9px]'}`} style={{ backgroundColor: rowColor }}>
                                                        {item.responsable}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {planningDays.map((day, i) => {
                                        const dateKey = formatDateKey(day);
                                        const shifts = rowSchedule[dateKey] || [];
                                        const hasShifts = shifts.length > 0;
                                        
                                        if (isExpanded) {
                                            if (!hasShifts) {
                                                return <td key={i} className="border-r border-slate-100 bg-slate-50/30 cursor-pointer" onClick={() => toggleRowExpanded(item.id)}></td>;
                                            }
                                            return (
                                                <td key={i} className="border-r border-slate-100 p-0 align-top h-full cursor-pointer" onClick={() => toggleRowExpanded(item.id)}>
                                                    <div className={`grid grid-cols-3 h-full ${isCompactMode ? 'min-h-[28px]' : 'min-h-[56px]'}`}>
                                                        {['T1', 'T2', 'T3'].map(shift => {
                                                            const isActive = shifts.includes(shift);
                                                            return (
                                                                <div 
                                                                    key={shift} 
                                                                    className={`transition-all flex items-center justify-center border-r border-white/50 last:border-r-0 ${isActive ? 'bg-amber-200 shadow-inner' : 'bg-slate-50 hover:bg-slate-100'}`}
                                                                >
                                                                    <span className={`font-bold ${isCompactMode ? 'text-[8px]' : 'text-[9px]'} ${isActive ? 'text-amber-900' : 'text-slate-300'}`}>
                                                                      {isCompactMode && viewRange === 14 ? shift[1] : shift}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        } else {
                                            const barColor = filterResponsable === '' ? rowColor : '#4f46e5';
                                            return (
                                                <td key={i} className="border-r border-slate-50 p-1 h-full relative align-middle">
                                                    <div className={`w-full flex items-center cursor-pointer rounded-sm hover:bg-slate-50 ${isCompactMode ? 'h-[20px]' : 'h-[40px]'}`} onClick={() => toggleRowExpanded(item.id)}>
                                                        {hasShifts ? (
                                                            <div 
                                                              className={`w-full transition-colors rounded-sm shadow-sm opacity-90 hover:opacity-100 ${isCompactMode ? 'h-3' : 'h-5'}`} 
                                                              style={{ backgroundColor: barColor }}
                                                              title="Clic para desglosar turnos"
                                                            ></div>
                                                        ) : (
                                                            <div className={`w-full transition-colors ${isCompactMode ? 'h-3' : 'h-5'}`}></div>
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
                            <tr><td colSpan={viewRange + 1} className="p-10 text-center text-slate-400 text-sm font-medium">No se encontraron actividades programadas en este rango.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
                <div className="bg-white p-3 border-t border-slate-100 flex items-center justify-end text-xs font-medium text-slate-500 space-x-6 print:hidden">
                    <div className="flex items-center"><div className="w-3 h-3 bg-indigo-500 mr-2 rounded-sm shadow-sm"></div> Día con Actividad</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-amber-200 border border-amber-300 mr-2 rounded-sm shadow-sm"></div> Turno Asignado</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-slate-50 border border-slate-200 mr-2 rounded-sm"></div> Sin Asignar</div>
                </div>
            </Card>
          </div>
        )}

        {/* ================= VISTA: GESTIÓN ================= */}
        {view === 'entry' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Base de Datos</h2>
               <button 
                 onDoubleClick={() => setShowForms(!showForms)}
                 className="flex items-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm focus:outline-none hover:bg-slate-50"
                 title="Haz doble clic para mostrar/ocultar los paneles de registro"
               >
                 <Pencil size={14} className="mr-2 text-indigo-600"/> 
                 {showForms ? 'Ocultar Formularios (Doble Clic)' : 'Añadir Datos (Doble Clic)'}
               </button>
            </div>

            <div className={`grid grid-cols-1 ${showForms ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 transition-all duration-300`}>
                
                {showForms && (
                  <div className="lg:col-span-1 space-y-6 animate-in slide-in-from-left duration-300">
                    <Card className="p-6 bg-slate-50 border-slate-200">
                        <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center uppercase tracking-widest">
                        <Clipboard className="mr-2 text-indigo-600" size={16}/> Pegado Masivo 
                      </h3>
                      <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                        Formato requerido: <br/><b className="block mt-1 font-mono bg-white p-1 rounded border border-slate-200">ACTIVIDAD | PUESTO | F. INICIO | F. FIN | FECHA 1 | TURNOS 1 | ...</b>
                      </p>
                      <textarea 
                        rows={6} value={pasteData} onChange={(e) => setPasteData(e.target.value)}
                        className="w-full text-[10px] p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4 font-mono leading-relaxed bg-white"
                        placeholder="MTTO RODILLO | MECANICO | 22/06/2026 | 25/06/2026 | 22/06/2026 | T1,T2 | 23/06/2026 | T1,T2 | - | -"
                      />
                      <button type="button" onClick={handlePasteProcess} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
                          Procesar Datos
                      </button>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center uppercase tracking-widest">
                        <PlusCircle className="mr-2 text-emerald-500" size={16}/> Carga Manual
                      </h3>
                      <form onSubmit={handleAddData} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Actividad</label>
                          <textarea required rows={2} name="actividad" value={formData.actividad} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-sm border bg-slate-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Fecha Inicio</label>
                              <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-xs font-medium border bg-slate-50" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Fecha Fin</label>
                              <input type="date" name="fechaFin" value={formData.fechaFin} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-xs font-medium border bg-slate-50" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Turnos Diarios Fijos</label>
                                <div className="flex space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="turnoT1" checked={formData.turnoT1} onChange={(e) => setFormData(prev => ({...prev, turnoT1: e.target.checked}))} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        <span>Turno 1</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="turnoT2" checked={formData.turnoT2} onChange={(e) => setFormData(prev => ({...prev, turnoT2: e.target.checked}))} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        <span>Turno 2</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="turnoT3" checked={formData.turnoT3} onChange={(e) => setFormData(prev => ({...prev, turnoT3: e.target.checked}))} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        <span>Turno 3</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Especialidad / Responsable</label>
                          <input name="responsable" value={formData.responsable} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-sm font-medium border bg-slate-50" />
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 transition-colors mt-2">
                          Guardar Registro
                        </button>
                      </form>
                    </Card>
                  </div>
                )}

                <div className={showForms ? "lg:col-span-2" : "col-span-1"}>
                  <Card className="h-full flex flex-col border-none shadow-md overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                       <h3 className="font-bold text-slate-800 text-sm tracking-tight">Directorio Activo <span className="ml-2 text-xs text-slate-400 font-medium">({data.length} elementos)</span></h3>
                       <div className="flex items-center space-x-3">
                          <button onClick={handleClearAll} className="flex items-center space-x-2 text-rose-500 hover:text-rose-700 transition-colors p-2 rounded-lg hover:bg-rose-50 font-semibold text-xs border border-transparent hover:border-rose-200" title="Eliminar todos los registros">
                            <Trash2 size={14} /> <span>Vaciar Base de Datos</span>
                          </button>
                       </div>
                    </div>
                    <div className="overflow-x-auto flex-1 p-0 custom-scrollbar bg-slate-50/30">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 sticky top-0 z-10 border-b border-slate-200 tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Actividad</th>
                            <th className="px-6 py-4">Responsable</th>
                            <th className="px-6 py-4 text-center">F. Inicio</th>
                            <th className="px-6 py-4 text-center">F. Fin</th>
                            <th className="px-6 py-4 text-center">Gestión</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 font-semibold text-slate-800 max-w-xs truncate">{item.actividad}</td>
                              <td className="px-6 py-3 text-xs font-medium text-slate-500">
                                <span className="px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">{item.responsable}</span>
                              </td>
                              <td className="px-6 py-3 text-center text-xs text-slate-500 font-medium">
                                  {item.fechaInicio || '-'}
                              </td>
                              <td className="px-6 py-3 text-center text-xs text-slate-500 font-medium">
                                  {item.fechaFin || '-'}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-rose-50">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {data.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-400 text-sm font-medium">La base de datos está vacía.</td></tr>
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
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: 0.2s; }
        input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
        
        @media print {
            body { background-color: white !important; margin: 0 !important; padding: 0 !important; }
            .print\\:hidden { display: none !important; }
            main { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
            .gantt-print-area { box-shadow: none !important; border: 1px solid #e2e8f0 !important; width: 100% !important; max-width: 100% !important; }
            .gantt-print-area .custom-scrollbar { overflow: visible !important; }
            table { width: 100% !important; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}} />
    </div>
  );
}