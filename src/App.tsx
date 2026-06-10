/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, 
  HeartHandshake, 
  Truck, 
  Copy, 
  Check, 
  Smartphone, 
  Send, 
  Share2, 
  FileText, 
  Mail, 
  Award, 
  PenTool, 
  Users, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  Printer, 
  Download, 
  RefreshCw, 
  Eye, 
  ExternalLink,
  ChevronDown,
  Search,
  BookMarked,
  Info,
  Layers,
  FileCheck2,
  Lock,
  Calendar,
  Layers2,
  HelpCircle,
  FileSpreadsheet,
  Settings,
  UserPlus,
  Trash2,
  Key,
  LogIn,
  LogOut,
  Database,
  Code2,
  Pencil,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  POLICIES, 
  REGULATIONS, 
  WHATS_APP_TEMPLATES, 
  EMAIL_TEMPLATE_HTML,
  PolicySection,
  RegulationItem
} from "./data";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";

export interface WorkerProfile {
  id: string;
  fullName: string;
  dni: string;
  puesto: string;
  obra: string;
  pin: string;
  duracion: string;
}

const DEFAULT_WORKERS: WorkerProfile[] = [
  {
    id: "w1",
    fullName: "Marcelo Gómez",
    dni: "30567890",
    puesto: "Operario de Obra",
    obra: "YPF Planta La Plata",
    pin: "1234",
    duracion: "6 meses"
  },
  {
    id: "w2",
    fullName: "Claudio Peralta",
    dni: "28123456",
    puesto: "Conductor de Flota",
    obra: "Gasoducto Vaca Muerta",
    pin: "5678",
    duracion: "12 meses"
  },
  {
    id: "w3",
    fullName: "Romina Díaz",
    dni: "35890123",
    puesto: "Supervisor de Obra",
    obra: "Refinería Luján de Cuyo",
    pin: "9012",
    duracion: "3 meses"
  }
];

export default function App() {
  // Determina si estamos en la vista de operario exclusivo desde la URL (?mode=operario or ?mode=worker)
  const isWorkerOnly = typeof window !== "undefined" && (
    new URLSearchParams(window.location.search).get("mode") === "operario" ||
    new URLSearchParams(window.location.search).get("mode") === "worker"
  );

  // App Role View ("admin" or "operario")
  const [currentRoleView, setCurrentRoleView] = useState<"admin" | "operario">("admin");

  // Sync role view with URL on initial load if specified
  useEffect(() => {
    if (isWorkerOnly) {
      setCurrentRoleView("operario");
    }
  }, [isWorkerOnly]);

  // Workers registered in the system (sync with Firestore in real-time)
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);

  // Registered digital signatures in the system (sync with Firestore in real-time)
  const [signatures, setSignatures] = useState<any[]>([]);

  // Sync workers in real-time with Firestore. Auto-seeds defaults if empty.
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "workers"), (snapshot) => {
      if (snapshot.empty) {
        // Seeding initial default workers to Firestore as a safety baseline
        DEFAULT_WORKERS.forEach(async (w) => {
          try {
            await setDoc(doc(db, "workers", w.id), {
              fullName: w.fullName,
              dni: w.dni,
              puesto: w.puesto,
              obra: w.obra,
              pin: w.pin,
              duracion: w.duracion || "6 meses"
            });
          } catch (e) {
            console.error("Error seeding default worker:", e);
          }
        });
      } else {
        const list: WorkerProfile[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            fullName: data.fullName || "",
            dni: data.dni || "",
            puesto: data.puesto || "",
            obra: data.obra || "",
            pin: data.pin || "",
            duracion: data.duracion || "6 meses"
          });
        });
        setWorkers(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "workers");
    });
    return () => unsub();
  }, []);

  // Sync submitted signatures in real-time from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "signatures"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Sort signatures chronologically (newest first) based on signature document ID
      list.sort((a, b) => b.id.localeCompare(a.id));
      setSignatures(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "signatures");
    });
    return () => unsub();
  }, []);

  // Current logged in worker profile
  const [currentUser, setCurrentUser] = useState<WorkerProfile | null>(null);

  // Load and recover logged-in user profile from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("azilut_current_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
        } catch (e) {
          console.error("Error parsing saved current user:", e);
        }
      }
    }
  }, []);

  // Mobile Simulator state
  const [currentTab, setCurrentTab] = useState<"booklet" | "reglamento" | "firma">("booklet");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("politica-integrada");
  const [searchText, setSearchText] = useState<string>("");
  const [showFullVerbatim, setShowFullVerbatim] = useState<boolean>(false);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

  // Regulation Checkboxes state
  const [checkedRegulations, setCheckedRegulations] = useState<Record<string, boolean>>({});
  
  // Signature & Work details
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Operario de Obra");
  const [userDni, setUserDni] = useState<string>("");
  const [workDuration, setWorkDuration] = useState<string>("");
  const [workName, setWorkName] = useState<string>("");
  const [hasSubmittedSignature, setHasSubmittedSignature] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [certificateCode, setCertificateCode] = useState<string>("");
  const [savedSignatureImg, setSavedSignatureImg] = useState<string>("");
  const [selectedWorkerSignature, setSelectedWorkerSignature] = useState<any | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
  const [signatureToDelete, setSignatureToDelete] = useState<string | null>(null);

  // Form states for creating/editing workers (Administrador)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [newWorkerName, setNewWorkerName] = useState<string>("");
  const [newWorkerDni, setNewWorkerDni] = useState<string>("");
  const [newWorkerPuesto, setNewWorkerPuesto] = useState<string>("");
  const [newWorkerObra, setNewWorkerObra] = useState<string>("");
  const [newWorkerDuracion, setNewWorkerDuracion] = useState<string>("6 meses");
  const [newWorkerPin, setNewWorkerPin] = useState<string>(() => Math.floor(1000 + Math.random() * 9000).toString());

  // Operator login state variables
  const [loginDni, setLoginDni] = useState<string>("");
  const [loginPin, setLoginPin] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  // Admin PIN configuration / Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("azilut_admin_authorized") === "true";
    }
    return false;
  });
  const [adminPinInput, setAdminPinInput] = useState<string>("");
  const [adminPinError, setAdminPinError] = useState<string>("");
  const ADMIN_PIN_DEFAULT = "1234"; // PIN de fábrica por defecto para desarrollo o producción (puedes cambiarlo directamente aquí)

  // Sync current logged-in user with form fields & localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("azilut_current_user", JSON.stringify(currentUser));
      setUserName(currentUser.fullName);
      setUserDni(currentUser.dni);
      setWorkDuration(currentUser.duracion || "6 meses");
      setWorkName(currentUser.obra);
      setUserRole(currentUser.puesto);
    } else {
      localStorage.removeItem("azilut_current_user");
      setUserName("");
      setUserDni("");
      setWorkDuration("");
      setWorkName("");
      setUserRole("Operario de Obra");
    }
  }, [currentUser]);

  // Load existing signature if current worker has already signed
  useEffect(() => {
    if (currentUser && signatures.length > 0) {
      const existingSig = signatures.find(
        (s) => s.workerDni === currentUser.dni || s.workerId === currentUser.id
      );
      if (existingSig) {
        setCertificateCode(existingSig.certificateCode || "");
        setSavedSignatureImg(existingSig.signatureImg || "");
        setHasSubmittedSignature(true);
      } else {
        setCertificateCode("");
        setSavedSignatureImg("");
        setHasSubmittedSignature(false);
      }
    } else if (!currentUser) {
      setCertificateCode("");
      setSavedSignatureImg("");
      setHasSubmittedSignature(false);
    }
  }, [currentUser, signatures]);

  // Canvas ref for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Administrative Panel State
  const [selectedWaTemplate, setSelectedWaTemplate] = useState<string>("wa-oficial");
  const [customAppLink, setCustomAppLink] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let origin = window.location.origin;
      // If it is the dev iframe URL, convert it to the public Shared App URL to avoid login/403 issues on other devices
      if (origin.includes("ais-dev-")) {
        origin = origin.replace("ais-dev-", "ais-pre-");
      }
      return `${origin}?mode=operario`;
    }
    return "https://azilut-manual.com?mode=operario";
  });
  const [waMessageText, setWaMessageText] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("DIFUSIÓN OFICIAL: Manual de Bolsillo y Políticas Integradas Azilut S.A.");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copyHtmlClicked, setCopyHtmlClicked] = useState<boolean>(false);

  // Onboarding metric slider
  const [rosterSize, setRosterSize] = useState<number>(180);
  const [communicationScore, setCommunicationScore] = useState<string>("interactive"); // offline vs email vs interactive

  // Synchronize WhatsApp template text whenever Link or template changes
  useEffect(() => {
    const template = WHATS_APP_TEMPLATES.find(t => t.id === selectedWaTemplate);
    if (template) {
      const updatedText = template.text.replace("[URL_DEL_MANUAL]", customAppLink);
      setWaMessageText(updatedText);
    }
  }, [selectedWaTemplate, customAppLink]);

  // Sync canvas filling when signature tab is rendered
  useEffect(() => {
    if (currentTab === "firma" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [currentTab]);

  // Auto scroll to signatures once they are submitted or when changing tab to keep visual flow
  const handleRegulationToggle = (id: string) => {
    setCheckedRegulations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAllRegulations = () => {
    const allChecked: Record<string, boolean> = {};
    REGULATIONS.forEach(item => {
      allChecked[item.id] = true;
    });
    setCheckedRegulations(allChecked);
  };

  const handleClearAllRegulations = () => {
    setCheckedRegulations({});
  };

  const getRegulationsProgress = () => {
    const total = REGULATIONS.length;
    const checkedCount = Object.values(checkedRegulations).filter(Boolean).length;
    const isCompleted = checkedCount === total;
    return {
      total,
      checkedCount,
      percent: Math.round((checkedCount / total) * 100),
      isCompleted
    };
  };

  // Canvas Handlers for Signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.strokeStyle = "#0f172a"; // dark blueprint ink
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    const rect = canvas.getBoundingClientRect();
    let x = 0;
    let y = 0;
    
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    const actualX = x * (canvas.width / rect.width);
    const actualY = y * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(actualX, actualY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x = 0;
    let y = 0;
    
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    const actualX = x * (canvas.width / rect.width);
    const actualY = y * (canvas.height / rect.height);
    
    ctx.lineTo(actualX, actualY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Administrador: Agregar o Editar trabajador en la nómina (saved online to Firestore)
  const handleRegisterWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim() || !newWorkerDni.trim() || !newWorkerPuesto.trim() || !newWorkerObra.trim() || !newWorkerPin.trim()) {
      return;
    }
    
    // Check if worker already exists (excluding the one currently editing)
    if (workers.some(w => w.dni.trim() === newWorkerDni.trim() && w.id !== editingWorkerId)) {
      alert("Error: Ya existe un operario guardado con ese DNI.");
      return;
    }

    const workerId = editingWorkerId || `w-${Date.now()}`;
    const newWorker = {
      fullName: newWorkerName.trim(),
      dni: newWorkerDni.trim(),
      puesto: newWorkerPuesto.trim(),
      obra: newWorkerObra.trim(),
      duracion: newWorkerDuracion.trim() || "6 meses",
      pin: newWorkerPin.trim()
    };

    try {
      await setDoc(doc(db, "workers", workerId), newWorker);
      
      // If we edited the logged-in user, live reload their session!
      if (currentUser && currentUser.id === workerId) {
        setCurrentUser({ id: workerId, ...newWorker });
      }

      // Reset form
      setNewWorkerName("");
      setNewWorkerDni("");
      setNewWorkerPuesto("");
      setNewWorkerObra("");
      setNewWorkerDuracion("6 meses");
      setNewWorkerPin(Math.floor(1000 + Math.random() * 9000).toString());
      setEditingWorkerId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workers/${workerId}`);
    }
  };

  // Administrador: Eliminar trabajador de la nómina
  const handleRemoveWorker = (id: string) => {
    setWorkerToDelete(id);
  };

  // Operario: Iniciar Sesión en el simulador celular
  const handleOperatorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const matched = workers.find(
      w => w.dni.replace(/\D/g, '') === loginDni.replace(/\D/g, '') && w.pin === loginPin
    );

    if (matched) {
      setCurrentUser(matched);
      setLoginDni("");
      setLoginPin("");
    } else {
      setLoginError("DNI o PIN de acceso incorrecto.");
    }
  };

  // Operario: Cerrar Sesión
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Submit commitment and create unique reference hash (saved online to Firestore)
  const handleSubmitEngagement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userDni.trim() || !workDuration.trim() || !workName.trim()) return;

    // Create unique credential code
    const uniqueHash = `AZ-${Math.floor(100000 + Math.random() * 900000)}-${userRole.substring(0,3).toUpperCase()}`;
    
    // Capture user's actual drawing from the canvas
    const signatureImg = canvasRef.current ? canvasRef.current.toDataURL("image/png") : "";
    setSavedSignatureImg(signatureImg);

    const signatureId = `sig-${Date.now()}`;
    const newSignature = {
      certificateCode: uniqueHash,
      workerId: currentUser?.id || "anonymous",
      workerName: userName.trim(),
      workerDni: userDni.trim(),
      workerRole: userRole.trim(),
      workName: workName.trim(),
      workDuration: workDuration.trim(),
      signatureImg: signatureImg,
      signedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "signatures", signatureId), newSignature);
      setCertificateCode(uniqueHash);
      setHasSubmittedSignature(true);
      
      // Simulate celebration
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `signatures/${signatureId}`);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleShareWithHR = () => {
    const message = `*AZILUT S.A. — COMPROBANTE DE COMPROMISO DIGITAL*\n\n` +
      `✓ *Operario*: ${userName.toUpperCase()}\n` +
      `✓ *DNI*: ${userDni}\n` +
      `✓ *Puesto*: ${userRole}\n` +
      `✓ *Obra*: ${workName}\n` +
      `✓ *ID Certificado*: ${certificateCode}\n` +
      `✓ *Estado*: 21 Declaraciones Aprobadas (100% Completo)\n` +
      `✓ *Rúbrica*: Registrada online en base de datos Firestore\n\n` +
      `*Enlace verificación*: ${customAppLink}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleDownloadCredential = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background (premium ticket cardboard color with double border)
      ctx.fillStyle = "#faf9f6"; // beautiful cream paper light background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

      ctx.strokeStyle = "#dc2626"; // AZILUT RED
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

      // Header Banner
      ctx.fillStyle = "#0f172a"; // deep slate header bar
      ctx.fillRect(20, 20, canvas.width - 40, 52);

      // AZILUT logo style icon on left of bar
      ctx.fillStyle = "#dc2626"; // Red badge
      ctx.fillRect(32, 28, 36, 36);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.fillText("A", 42, 55);

      // Text inside banner
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px Arial, sans-serif";
      ctx.fillText("AZILUT S.A. — CREDENCIAL DE DIFUSIÓN", 80, 52);

      // Info Fields Grid Layout
      ctx.fillStyle = "#1e293b"; // slate-800 text
      
      // Full Name
      ctx.fillStyle = "#64748b"; // slate-500 label
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("APELLIDO Y NOMBRE DEL TRABAJADOR", 32, 98);
      ctx.fillStyle = "#0f172a"; // dark slate text
      ctx.font = "bold 15px Arial, sans-serif";
      ctx.fillText(userName.toUpperCase(), 32, 118);

      // DNI
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("DNI (NÚMERO DE IDENTIFICACIÓN)", 32, 150);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 12px Courier, monospace";
      ctx.fillText(userDni, 32, 168);

      // Puesto/Puesto Laboral
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("OFICIO / PUESTO LABORAL", 32, 200);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(userRole.toUpperCase(), 32, 218);

      // Obra
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("OBRA ASIGNADA", 290, 150);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(workName.toUpperCase(), 290, 168);

      // Duración
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("DURACIÓN ESTIMADA", 290, 200);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(workDuration.toUpperCase(), 290, 218);

      // Declaration text box
      ctx.fillStyle = "#f1f5f9"; // light gray background for warning statement
      ctx.fillRect(32, 238, canvas.width - 64, 30);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.strokeRect(32, 238, canvas.width - 64, 30);

      ctx.fillStyle = "#334155";
      ctx.font = "bold 8px Arial, sans-serif";
      ctx.fillText("✓ DECLARACIÓN APROBADA: REGISTRO DE DIFUSIÓN DE POLÍTICAS EN PANEL DIGITAL DIRECTO SIN DEMORAS.", 40, 256);

      // Bottom Area: Signature on Left, QR on Right, Certification ID
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("RÚBRICA DIGITAL EN FILA", 32, 290);
      
      // Paint user signature if exists
      if (savedSignatureImg) {
        const img = new Image();
        img.src = savedSignatureImg;
        img.onload = () => {
          ctx.drawImage(img, 32, 296, 140, 42);
          finishCanvasExport(canvas);
        };
        img.onerror = () => {
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(32, 296, 140, 42);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "italic 11px Arial, sans-serif";
          ctx.fillText("Rúbrica Electrónica", 45, 320);
          finishCanvasExport(canvas);
        };
      } else {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(32, 296, 140, 42);
        ctx.strokeStyle = "#cbd5e1";
        ctx.strokeRect(32, 296, 140, 42);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "italic 10px Arial, sans-serif";
        ctx.fillText("[ Rúbrica Registrada ]", 45, 322);
        finishCanvasExport(canvas);
      }
    } catch (e) {
      console.error(e);
      alert("Error exportando credencial.");
    }
  };

  const finishCanvasExport = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Cert Code ID text centered clean on the right (without QR)
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 9px Courier, monospace";
    ctx.fillText("VERIFICADO ONLINE", canvas.width - 160, 298);
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 11px Courier, monospace";
    ctx.fillText(`CÓD: ${certificateCode || "AZ-991823"}`, canvas.width - 160, 314);

    // Generate PNG and download
    const link = document.createElement("a");
    link.download = `Credencial_Azilut_${userName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleDownloadSelectedWorkerCredential = (sig: any) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background (premium ticket cardboard color with double border)
      ctx.fillStyle = "#faf9f6"; // beautiful cream paper light background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

      ctx.strokeStyle = "#dc2626"; // AZILUT RED
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

      // Header Banner
      ctx.fillStyle = "#0f172a"; // deep slate header bar
      ctx.fillRect(20, 20, canvas.width - 40, 52);

      // AZILUT logo style icon on left of bar
      ctx.fillStyle = "#dc2626"; // Red badge
      ctx.fillRect(32, 28, 36, 36);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.fillText("A", 42, 55);

      // Text inside banner
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px Arial, sans-serif";
      ctx.fillText("AZILUT S.A. — CREDENCIAL DE DIFUSIÓN", 80, 52);

      // Info Fields Grid Layout
      ctx.fillStyle = "#1e293b"; // slate-800 text
      
      // Full Name
      ctx.fillStyle = "#64748b"; // slate-500 label
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("APELLIDO Y NOMBRE DEL TRABAJADOR", 32, 98);
      ctx.fillStyle = "#0f172a"; // dark slate text
      ctx.font = "bold 15px Arial, sans-serif";
      ctx.fillText(sig.workerName.toUpperCase(), 32, 118);

      // DNI
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("DNI (NÚMERO DE IDENTIFICACIÓN)", 32, 150);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 12px Courier, monospace";
      ctx.fillText(sig.workerDni, 32, 168);

      // Puesto/Puesto Laboral
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("OFICIO / PUESTO LABORAL", 32, 200);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(sig.workerRole.toUpperCase(), 32, 218);

      // Obra
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("OBRA ASIGNADA", 290, 150);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(sig.workName.toUpperCase(), 290, 168);

      // Duración
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("DURACIÓN ESTIMADA", 290, 200);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(sig.workDuration.toUpperCase(), 290, 218);

      // Declaration text box
      ctx.fillStyle = "#f1f5f9"; // light gray background for warning statement
      ctx.fillRect(32, 238, canvas.width - 64, 30);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.strokeRect(32, 238, canvas.width - 64, 30);

      ctx.fillStyle = "#334155";
      ctx.font = "bold 8px Arial, sans-serif";
      ctx.fillText("✓ DECLARACIÓN APROBADA: REGISTRO DE DIFUSIÓN DE POLÍTICAS EN PANEL DIGITAL DIRECTO SIN DEMORAS.", 40, 256);

      // Bottom Area: Signature on Left, QR on Right, Certification ID
      ctx.fillStyle = "#64748b";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("RÚBRICA DIGITAL EN FILA", 32, 290);

      const triggerDownload = () => {
        // Cert Code ID text centered clean on the right (without QR)
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 9px Courier, monospace";
        ctx.fillText("VERIFICADO ONLINE", canvas.width - 160, 298);
        ctx.fillStyle = "#dc2626";
        ctx.font = "bold 11px Courier, monospace";
        ctx.fillText(`CÓD: ${sig.certificateCode}`, canvas.width - 160, 314);

        // Generate PNG and download
        const link = document.createElement("a");
        link.download = `Credencial_Azilut_${sig.workerName.replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };

      if (sig.signatureImg) {
        const img = new Image();
        img.src = sig.signatureImg;
        img.onload = () => {
          ctx.drawImage(img, 32, 296, 140, 42);
          triggerDownload();
        };
        img.onerror = () => {
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(32, 296, 140, 42);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "italic 11px Arial, sans-serif";
          ctx.fillText("Rúbrica Electrónica", 45, 320);
          triggerDownload();
        };
      } else {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(32, 296, 140, 42);
        ctx.strokeStyle = "#cbd5e1";
        ctx.strokeRect(32, 296, 140, 42);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "italic 10px Arial, sans-serif";
        ctx.fillText("[ Rúbrica Registrada ]", 45, 322);
        triggerDownload();
      }
    } catch (e) {
      console.error(e);
      alert("Error exportando credencial.");
    }
  };

  const progress = getRegulationsProgress();
  const sortedRegulations = REGULATIONS;

  // Efficiency statistics based on rosterSize (Calculado con la nueva norma de 4 hojas A4 y 2 horas optimizadas por persona)
  const papersSaved = rosterSize * 4; // 4 hojas A4 por trabajador (1 por cada una de las 3 políticas + 1 para firmar la declaración)
  const processHoursSaved = rosterSize * 2; // 2 horas de lectura, comprensión y firma física por persona

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col premium-dark-grid relative overflow-x-hidden">
      
      {/* BACKGROUND GRAPHIC ORBITS */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-650/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* AZILUT RED LOGO */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-red-650 rounded-lg text-white font-extrabold text-3xl shadow-lg shadow-red-600/20">
                A
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-widest text-white flex items-center gap-1.5">
                  AZILUT <span className="text-red-500 text-sm font-mono tracking-normal border border-red-500/30 px-1.5 py-0.5 rounded uppercase">S.A.</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">Sistema de gestion integrado</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-full border border-slate-850">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-300 font-mono">100% Cero Papel — WhatsApp & Mail Ready</span>
          </div>
        </div>
      </header>
      
      {/* GLOBAL ROLE SWITCHER BOARD */}
      {!isWorkerOnly && (
        <div className="bg-slate-900/40 border-b border-slate-850 py-3 px-6 flex justify-between items-center gap-3 shadow-inner">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Ambiente de Trabajo:</span>
              <span className="text-xs bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-red-400 font-bold font-mono">Control de Roles Activo</span>
            </div>
            
            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                onClick={() => {
                  setCurrentRoleView("admin");
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("mode");
                    window.history.pushState({}, "", url.toString());
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-2 ${
                  currentRoleView === "admin" 
                    ? "bg-red-650 text-white shadow-md shadow-red-750/30" 
                    : "text-slate-400 hover:text-slate-205"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Entorno Administrador (Completo)
              </button>
              <button
                onClick={() => {
                  setCurrentRoleView("operario");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-2 ${
                  currentRoleView === "operario" 
                    ? "bg-red-650 text-white shadow-md shadow-red-750/30" 
                    : "text-slate-400 hover:text-slate-205"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Estación Operario (Vista Celular)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-HEADER CONCEPT CAROUSAL */}
      <div className="bg-gradient-to-r from-red-950/20 via-slate-900/90 to-slate-950 border-b border-slate-850 px-6 py-4 font-sans">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/30 text-red-500 rounded-lg border border-red-800/20 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Sistema de Difusion oficial
              </h2>
              <p className="text-slate-400 text-xs font-mono">AZILUT S.A. • CONTROL CENTRALIZADO</p>
            </div>
          </div>
          <span className="hidden md:inline-block text-[9px] font-mono text-slate-500 bg-slate-950/80 border border-slate-900 px-3 py-1 rounded font-bold uppercase tracking-wider">
            Portal Corporativo S.I.G.
          </span>
        </div>
      </div>

      {/* DUAL WORKSPACE SECTION */}
      <main className={`flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 gap-8 items-start ${
        currentRoleView === "operario" ? "flex justify-center" : "grid grid-cols-1 lg:grid-cols-12"
      }`}>
        
        {/* SIMULADOR DE CELULAR POCKET */}
        <div className={currentRoleView === "operario" ? "w-full max-w-[360px] flex flex-col items-center" : "lg:col-span-5 flex flex-col items-center"}>
          <div className="w-full max-w-[350px]">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-red-500" /> Simulación de Bolsillo
              </span>
              <span className="text-xs font-mono text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Interactivo PWA
              </span>
            </div>

            {/* CELULAR Renders */}
            <div className="relative mx-auto w-full aspect-[9/19] bg-slate-950 rounded-[48px] border-[12px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden ring-1 ring-slate-700/50">
              
              {/* CAMERA NOTCH */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-36 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-950 rounded-full ml-3 border border-slate-800" />
              </div>

              {/* PHONE STATUS BAR */}
              <div className="bg-slate-900 text-slate-400 text-[10px] font-mono px-6 pt-5 pb-2.5 flex justify-between items-center z-40 select-none border-b border-slate-850">
                <span>15:30 <span className="text-[8px]">PM</span></span>
                <span className="text-[9px] text-red-500 font-extrabold tracking-widest uppercase">Azilut S.A.</span>
                <div className="flex items-center gap-1">
                  <span className="text-[8px]">5G</span>
                  <span className="text-[9.5px]">🔋 100%</span>
                </div>
              </div>

              {/* CELULAR INTERIOR NAV HEADER */}
              <div className="bg-slate-900 p-3 flex items-center justify-between z-30 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded flex items-center justify-center font-extrabold text-md text-white shadow-sm shadow-red-550/20">A</div>
                  <div>
                    <div className="text-[12px] font-extrabold tracking-white leading-none text-white">AZILUT S.A.</div>
                    <div className="text-[8px] text-slate-400 font-mono tracking-widest uppercase">Manual de Bolsillo</div>
                  </div>
                </div>
                <div className="text-[9px] font-mono font-bold bg-red-950 text-red-400 border border-red-900/40 px-2 py-0.5 rounded uppercase">Anexo III</div>
              </div>

              {/* COMPLEMENTARY PROCESS BAR & REGISTERED USER CHECK */}
              <div className="bg-slate-950 px-3 py-2 border-b border-slate-850 flex justify-between items-center text-[10px] z-30 min-h-[34px]">
                {currentUser ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                      <span className="font-extrabold text-slate-200 truncate uppercase text-[9px] tracking-tight" title={currentUser.fullName}>
                        {currentUser.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded ${progress.isCompleted ? 'bg-emerald-950 text-emerald-400 font-bold' : 'bg-slate-900 text-amber-500 font-bold'}`}>
                        {progress.checkedCount}/{progress.total} Ok
                      </span>
                      <button 
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-400 transition-all flex items-center cursor-pointer"
                        title="Cerrar Sesión"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500/70" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="font-mono text-slate-400 text-[8.5px] mx-auto uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-red-505/80 animate-pulse" /> Se requiere acceso con PIN de Operario
                  </span>
                )}
              </div>

              {/* SIMULATOR TAB CONTENT WINDOW - SCROLL INDEPENDENT */}
              <div className="flex-grow overflow-y-auto bg-slate-900 text-slate-200 p-3 text-xs flex flex-col relative select-none">
                
                <AnimatePresence mode="wait">
                  
                  {!currentUser ? (
                    <motion.div
                      key="login-screen"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col flex-grow justify-center py-1"
                    >
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-855 flex flex-col items-center">
                        <div className="w-9 h-9 bg-red-650/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mb-2.5">
                          <Lock className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-white font-extrabold text-[12.5px] text-center uppercase tracking-wider">Portal del Operario</h3>
                        <p className="text-[9px] text-slate-400 text-center mt-1 leading-relaxed max-w-[210px]">
                          Para acceder al manual, validar políticas y asentar su firma, ingrese sus datos autorizados:
                        </p>

                        {loginError && (
                          <div className="bg-red-950/40 text-red-400 border border-red-900/30 p-2 rounded-lg text-[8.5px] leading-tight text-center my-2 w-full font-mono">
                            {loginError}
                          </div>
                        )}

                        <form onSubmit={handleOperatorLogin} className="w-full space-y-2 mt-3.5">
                          <div>
                            <label className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">D.N.I. (Solo Números)</label>
                            <input 
                              type="text" 
                              required
                              value={loginDni}
                              onChange={(e) => setLoginDni(e.target.value.replace(/\D/g, ""))}
                              placeholder="Ej: 30567890"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-red-500 font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">PIN / Clave Numérica</label>
                            <input 
                              type="password" 
                              required
                              maxLength={6}
                              value={loginPin}
                              onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ""))}
                              placeholder="Ej: 1234"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-red-500 font-mono text-center tracking-widest"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-red-650 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-[9.5px] uppercase tracking-wider cursor-pointer mt-1"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            Ingresar al Sistema
                          </button>
                        </form>

                        {/* ACCESO RÁPIDO INTERACTIVO DEMO */}
                        {currentRoleView === "admin" && isAdminAuthenticated && (
                          <div className="w-full border-t border-slate-850 mt-4 pt-3 text-center">
                            <span className="text-[7.5px] font-mono text-slate-500 block uppercase tracking-wider mb-1.5">Nómina Autorizada (Acceso Rápido Administrador)</span>
                            <div className="grid grid-cols-1 gap-1">
                              {workers.slice(0, 3).map(w => (
                                <button
                                  key={w.id}
                                  onClick={() => {
                                    setCurrentUser(w);
                                    setLoginError("");
                                  }}
                                  className="w-full bg-slate-900/60 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-850 hover:border-slate-700 flex items-center justify-between text-left text-[9px] text-slate-300 transition-all cursor-pointer"
                                >
                                  <div className="truncate pr-1">
                                    <span className="font-bold text-white block truncate leading-none mb-0.5">{w.fullName}</span>
                                    <span className="text-slate-500 font-mono block text-[8px] leading-none">DNI: {w.dni} • Obra: {w.obra}</span>
                                  </div>
                                  <span className="bg-red-950/80 text-red-450 border border-red-900/20 px-2 py-0.5 rounded font-mono text-[8px] tracking-widest shrink-0 font-bold">
                                    PIN {w.pin}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* TAB 1: MANUAL DE LECTURA */}
                      {currentTab === "booklet" && (
                    <motion.div
                      key="booklet"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex flex-col flex-grow"
                    >
                      <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                        Estas son las tres directrices de cumplimiento irrestricto:
                      </p>

                      {/* Selector de Políticas */}
                      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none border-b border-slate-850">
                        {POLICIES.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedPolicyId(p.id);
                              setShowFullVerbatim(true); // default expand in pocket model
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                              selectedPolicyId === p.id 
                                ? "bg-red-650 text-white shadow-md shadow-red-750/35" 
                                : "bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-850"
                            }`}
                          >
                            <span>{p.code}</span>
                          </button>
                        ))}
                      </div>

                      {/* Política Seleccionada Display */}
                      {(() => {
                        const policy = POLICIES.find(p => p.id === selectedPolicyId);
                        if (!policy) return null;
                        return (
                          <div className="flex flex-col flex-grow">
                            <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl mb-3">
                              <span className="text-[8.5px] font-mono text-red-500 font-bold uppercase tracking-widest">{policy.code}</span>
                              <h3 className="text-[12px] font-extrabold text-white leading-tight mt-0.5">{policy.title}</h3>
                              <p className="text-slate-350 text-[10px] mt-2 leading-relaxed bg-slate-900 border-l-2 border-red-500 p-2 rounded italic">
                                "{policy.summary}"
                              </p>
                            </div>

                            {/* TEXTO OFICIAL COPIA FIEL COMPROMISE */}
                            <div className="flex justify-between items-center mb-1 px-1">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Texto oficial</span>
                              <span className="text-[8.5px] text-red-400 font-mono">100% Completo y Fiel</span>
                            </div>

                            <div className="bg-slate-950 max-h-[160px] overflow-y-auto border border-slate-850 rounded-xl p-3 text-[9px] text-slate-300 leading-relaxed font-sans text-justify shadow-inner">
                              <pre className="whitespace-pre-wrap font-sans">
                                {policy.verbatim}
                              </pre>
                            </div>

                            <div className="mt-auto pt-3">
                              <button
                                onClick={() => setCurrentTab("reglamento")}
                                className="w-full bg-red-650 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] shadow-lg shadow-red-905/10"
                              >
                                Ir a Declaración de Conocimiento →
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {/* TAB 2: REGLAMENTO (21 OBLIGATIONAL CHECKBOXES) */}
                  {currentTab === "reglamento" && (
                    <motion.div
                      key="reglamento"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex flex-col flex-grow"
                    >
                      <div className="bg-slate-950 p-2.5 border border-slate-850 rounded-xl mb-2 flex items-start gap-2">
                        <FileCheck2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-[11px] text-white uppercase tracking-wider">Aprobación del Reglamento</h4>
                          <p className="text-slate-400 text-[8.5px] leading-relaxed mt-0.5">
                            El operario debe aceptar individualmente los 21 puntos obligatorios de convivencia, seguridad e higiene para poder firmar.
                          </p>
                        </div>
                      </div>

                      {/* FAST GROUP SELECTORS TO FACILITATE DEMO */}
                      <div className="flex justify-between gap-2.5 mb-2.5 px-0.5">
                        <button 
                          onClick={handleSelectAllRegulations}
                          className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 p-1.5 rounded-lg text-[9px] font-bold text-slate-300 transition-all font-mono"
                        >
                          ✓ Confirmar Todo (Sí)
                        </button>
                        <button 
                          onClick={handleClearAllRegulations}
                          className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 p-1.5 rounded-lg text-[9px] font-bold text-slate-300 transition-all font-mono"
                        >
                          ✕ Limpiar Selección
                        </button>
                      </div>

                      {/* CHECKLIST SCROLL WINDOW */}
                      <div className="flex-grow overflow-y-auto max-h-[220px] bg-slate-950 rounded-xl p-2 border border-slate-850 gap-2 flex flex-col shadow-inner">
                        {sortedRegulations.map((item, index) => {
                          const isChecked = !!checkedRegulations[item.id];
                          return (
                            <div 
                              key={item.id}
                              onClick={() => handleRegulationToggle(item.id)}
                              className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                                isChecked 
                                  ? "bg-slate-900 border-red-500/20 text-white" 
                                  : "bg-slate-950/60 border-slate-900 hover:bg-slate-900/30 text-slate-400"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 shrink-0 select-none">
                                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                    isChecked 
                                      ? "bg-red-650 border-red-500 text-white" 
                                      : "border-slate-700 bg-slate-950"
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                                <div className="flex-grow">
                                  <div className="text-[9.5px] leading-relaxed text-slate-200">
                                    <strong className="text-red-500 mr-1 font-mono">#{index + 1}</strong>
                                    {item.text}
                                  </div>
                                  <span className="text-[7.5px] text-slate-500 font-mono tracking-wider block mt-1 uppercase">
                                    Categoría: {item.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* UNLOCK CRITERIA STATE */}
                      <div className="mt-2.5 pt-2 border-t border-slate-850">
                        {progress.isCompleted ? (
                          <div className="bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 p-2 rounded-xl text-[9px] leading-tight flex items-center gap-2 mb-2">
                            <span className="flex h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
                            <span><strong>¡REGLAMENTO LEÍDO AL 100%!</strong> Se ha desbloqueado correctamente tu panel de Firma.</span>
                          </div>
                        ) : (
                          <div className="bg-amber-950/30 text-amber-400 border border-amber-900/20 p-2 rounded-xl text-[9.5px] leading-tight flex items-start gap-2 mb-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-0.5" />
                            <span>Debes tildar las 21 pautas del reglamento interno anteriores para habilitar la Firma. Falta tildar <strong>{progress.total - progress.checkedCount}</strong> declaraciones.</span>
                          </div>
                        )}

                        <button
                          disabled={!progress.isCompleted}
                          onClick={() => setCurrentTab("firma")}
                          className={`w-full py-2.5 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                            progress.isCompleted
                              ? "bg-red-650 hover:bg-red-700 text-white shadow shadow-red-600/10"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          {progress.isCompleted ? "Continuar a colocar Firma →" : "Tilda todas las declaraciones para continuar"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: FIRMA DIGITAL & CERTIFICADOS */}
                  {currentTab === "firma" && (
                    <motion.div
                      key="firma"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex flex-col flex-grow"
                    >
                      {!hasSubmittedSignature ? (
                        <form onSubmit={handleSubmitEngagement} className="flex flex-col flex-grow text-slate-300 text-[10.5px]">
                          
                          {/* Guard check */}
                          {!progress.isCompleted && (
                            <div className="bg-amber-950/40 text-amber-400 p-3 rounded-lg border border-amber-900/30 text-[9px] mb-3">
                              ⚠️ <strong>Bloqueado</strong>: Se requiere tildar 'Sí' en las 21 declaraciones del Reglamento Interno antes de firmar la conformidad.
                              <button 
                                type="button" 
                                onClick={() => setCurrentTab("reglamento")}
                                className="block mt-1 font-bold underline cursor-pointer"
                              >
                                Volver al Reglamento
                              </button>
                            </div>
                          )}

                          {/* PRE-FILLED & SYSTEM-VERIFIED CREDENTIAL */}
                          <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl mb-3 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 mb-1">
                              <span className="text-[8px] font-mono text-emerald-450 uppercase font-bold tracking-wider flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-450" /> Credencial Registrada
                              </span>
                              <span className="bg-emerald-950/80 text-emerald-450 text-[6.5px] px-1.5 py-0.5 rounded font-mono uppercase font-bold">Verificado</span>
                            </div>
                            <div className="space-y-1.5 bg-slate-900/45 p-2 rounded-lg border border-slate-850 text-[10px]">
                              <div>
                                <span className="text-[7px] font-mono text-slate-500 block leading-none">APELLIDO Y NOMBRE</span>
                                <span className="text-[11px] font-bold text-white uppercase leading-tight">{userName}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-850/50">
                                <div>
                                  <span className="text-[7px] font-mono text-slate-500 block leading-none">DNI (NUMERO)</span>
                                  <span className="text-[9px] font-bold text-slate-300 font-mono">{userDni}</span>
                                </div>
                                <div>
                                  <span className="text-[7px] font-mono text-slate-500 block leading-none">OFICIO / PUESTO LABORAL</span>
                                  <span className="text-[9px] font-bold text-slate-300 truncate block">{userRole}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-850/50">
                                <div>
                                  <span className="text-[7px] font-mono text-slate-500 block leading-none">OBRA CORRESPONDIENTE</span>
                                  <span className="text-[9px] font-bold text-slate-300 truncate block">{workName}</span>
                                </div>
                                <div>
                                  <span className="text-[7px] font-mono text-slate-500 block leading-none">DURACIÓN ESTIMADA DE LA OBRA</span>
                                  <span className="text-[9px] font-bold text-slate-300">{workDuration}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* CANVAS SIGN BOARD */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1.5 px-1">
                              <label className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <PenTool className="w-3 h-3 text-red-500 animate-pulse" /> Firma obligatoria
                              </label>
                              <button 
                                type="button"
                                disabled={!progress.isCompleted}
                                onClick={clearSignature}
                                className="text-[8.5px] text-red-400 hover:underline disabled:opacity-50"
                              >
                                Limpiar Trazo
                              </button>
                            </div>
                            
                            <div className="bg-white rounded-xl overflow-hidden border border-slate-805 touch-none relative shadow-md">
                              <canvas
                                ref={canvasRef}
                                width={300}
                                height={90}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-[90px] cursor-crosshair bg-white"
                              />
                            </div>
                            <span className="text-[7.5px] text-slate-500 text-center block mt-1.5 italic">Escribe tu firma con el dedo o el mouse dentro del recuadro blanco</span>
                          </div>

                          {/* COMPLETED AGREEMENT SUBMIT */}
                          <button
                            type="submit"
                            disabled={!progress.isCompleted || !userName.trim() || !userDni.trim() || !workDuration.trim() || !workName.trim()}
                            className={`w-full py-2.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                              progress.isCompleted && userName.trim() && userDni.trim() && workDuration.trim() && workName.trim()
                                ? "bg-red-650 hover:bg-red-700 text-white shadow-lg shadow-red-700/20"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            }`}
                          >
                            <Lock className="w-4 h-4" />
                            Firmar y Generar Acta
                          </button>
                        </form>
                      ) : (
                        
                        /* Renders BREATHTAKING DIGITAL TICKET */
                        <div className="flex flex-col flex-grow items-center text-center">
                          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-1.5 animate-bounce">
                            <Check className="w-5.5 h-5.5 stroke-[3]" />
                          </div>
                          
                          <h4 className="text-white font-extrabold text-xs tracking-tight">
                            ¡CONFORMIDAD REGISTRADA!
                          </h4>
                          <p className="text-[8px] text-slate-400 mt-0.5 leading-relaxed max-w-[240px]">
                            Se guardó tu rúbrica digital sobre el Anexo III de Azilut S.A.
                          </p>

                          {/* TICKET CARD PREVIEW */}
                          <div className="w-full bg-white text-slate-900 rounded-xl p-3 my-3 text-left relative premium-paper-bg shadow-2xl border border-slate-350 transform rotate-1">
                            <div className="absolute top-0 right-0 px-1.5 py-0.5 font-mono text-[6px] text-slate-400 bg-slate-100 rounded-bl-lg border-l border-b border-slate-200 uppercase font-bold">
                              ID: {certificateCode.split('-')[1]}
                            </div>

                            <div className="border-b border-dashed border-slate-300 pb-1.5 mb-1.5 flex items-center gap-1.5 pt-1">
                              <span className="w-4 h-4 bg-red-650 text-white font-extrabold text-[9px] rounded flex items-center justify-center">A</span>
                              <div>
                                <span className="font-extrabold text-[9.5px] tracking-wider block text-slate-900 leading-none">AZILUT S.A.</span>
                              </div>
                            </div>

                            <div className="space-y-1 text-slate-900">
                              <div>
                                <div className="text-[6px] font-mono text-slate-500">APELLIDO Y NOMBRE</div>
                                <div className="text-[9.5px] font-extrabold uppercase leading-none">{userName}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <div>
                                  <div className="text-[6px] font-mono text-slate-500">DNI (NUMERO)</div>
                                  <div className="text-[8px] font-bold font-mono text-slate-800">{userDni}</div>
                                </div>
                                <div>
                                  <div className="text-[6px] font-mono text-slate-500">OFICIO / PUESTO LABORAL</div>
                                  <div className="text-[8px] font-bold text-slate-800 tracking-tight truncate">{userRole}</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-slate-100 mt-1">
                                <div>
                                  <div className="text-[6px] font-mono text-slate-500">DURACIÓN ESTIMADA DE LA OBRA</div>
                                  <div className="text-[8px] font-bold text-slate-800 tracking-tight">{workDuration}</div>
                                </div>
                                <div>
                                  <div className="text-[6px] font-mono text-slate-500">OBRA CORRESPONDIENTE</div>
                                  <div className="text-[8px] font-bold text-slate-800 tracking-tight truncate">{workName}</div>
                                </div>
                              </div>

                              {/* EXPLICIT ACCEPTANCE REGULATION LABEL */}
                              <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/60 mt-1.5 text-[7px] text-slate-600 leading-tight">
                                ✓ Declara conocer y comprender las 21 pautas del Manual de Gestión Integrado, Alcohol, Drogas y Conducción Vehicular.
                              </div>

                              {/* SIGNATURE RENDERS */}
                              <div className="border-t border-dashed border-slate-300 pt-1.5 mt-2 flex justify-between items-end">
                                <div>
                                  <span className="text-[6px] font-mono text-slate-500 block leading-none mb-1">FIRMA REGISTRADA</span>
                                  {savedSignatureImg ? (
                                    <div className="h-9 w-28 bg-slate-50 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                                      <img src={savedSignatureImg} alt="Firma digital" className="h-[95%] w-auto object-contain max-w-full" referrerPolicy="no-referrer" />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-24 bg-slate-50 rounded border border-slate-200/50 flex items-center justify-center font-mono text-[7px] text-slate-400 italic">
                                      [ Rúbrica Digital ]
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-[7px] font-mono text-slate-400 text-right uppercase">
                                  Registro Digital
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 w-full mt-1.5">
                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <button
                                onClick={handleDownloadCredential}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-[9px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Descargar como imagen premium de alta calidad para legajo"
                              >
                                <Download className="w-3 h-3" />
                                Descargar PNG
                              </button>
                              <button
                                onClick={handleShareWithHR}
                                className="bg-blue-650 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-[9px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Enviar comprobante formal directamente a RRHH por WhatsApp"
                              >
                                <Send className="w-3 h-3" />
                                Enviar a RRHH
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                // Permite volver al formulario de firma sin borrar datos declarados ni checklist de 21 declaraciones
                                setHasSubmittedSignature(false);
                              }}
                              className="w-full bg-amber-600/90 hover:bg-amber-600 text-white font-bold py-1.5 rounded-lg text-[9px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow border border-amber-500/20 animate-pulse-slow"
                              title="Corrige tu firma o datos de la credencial sin borrar tu progreso"
                            >
                              <Pencil className="w-3 h-3 text-amber-100" />
                              Rehacer Firma / Editar Datos
                            </button>

                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <button
                                onClick={() => {
                                  setHasSubmittedSignature(false);
                                  setUserName("");
                                  setUserDni("");
                                  setWorkDuration("");
                                  setWorkName("");
                                  handleClearAllRegulations();
                                  setCurrentTab("booklet");
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1 rounded-lg text-[8.5px] transition-all cursor-pointer"
                              >
                                Nuevo Registro
                              </button>
                              <button
                                onClick={() => handleCopy(`Azilut S.A. | Rúbrica oficial Código: ${certificateCode}. Trabajador: ${userName} DNI: ${userDni} para Obra: ${workName}. 21 declaraciones aprobadas.`, "certificado")}
                                className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 hover:border-slate-750 font-bold py-1 rounded-lg text-[8.5px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {copiedText === "certificado" ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                {copiedText === "certificado" ? "¡Copiado!" : "Copiar Hash"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                    </>
                  )}

                </AnimatePresence>

              </div>

              {/* PHONE FOOTER NAVEGACIÓN */}
              <div className="bg-slate-950 border-t border-slate-850 p-2 grid grid-cols-3 gap-1 z-30 select-none">
                <button
                  onClick={() => setCurrentTab("booklet")}
                  className={`py-1.5 flex flex-col items-center gap-0.5 rounded-xl transition-all ${
                    currentTab === "booklet" ? "text-red-500 bg-slate-900/40" : "text-slate-500 hover:text-slate-350"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-[8px] font-mono uppercase tracking-wider">Políticas</span>
                </button>

                <button
                  onClick={() => setCurrentTab("reglamento")}
                  className={`py-1.5 flex flex-col items-center gap-0.5 rounded-xl transition-all ${
                    currentTab === "reglamento" ? "text-red-505 bg-slate-900/40" : "text-slate-500 hover:text-slate-350"
                  }`}
                >
                  <FileCheck2 className={`w-4 h-4 ${progress.isCompleted ? 'text-emerald-500' : ''}`} />
                  <span className="text-[8px] font-mono uppercase tracking-wider">Reglamento</span>
                </button>

                <button
                  onClick={() => setCurrentTab("firma")}
                  className={`py-1.5 flex flex-col items-center gap-0.5 rounded-xl transition-all ${
                    currentTab === "firma" ? "text-red-500 bg-slate-900/40" : "text-slate-500 hover:text-slate-350"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span className="text-[8px] font-mono uppercase tracking-wider">Firma</span>
                </button>
              </div>

              {/* SMARTPHONE HOME LINE BUTTON BUTTON */}
              <div className="bg-slate-950 pb-2 pt-1 flex justify-center z-40 select-none">
                <div className="w-24 h-1 bg-slate-800 rounded-full hover:bg-slate-705 cursor-pointer" />
              </div>

            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (DESCENTRALIZACIÓN, COMPARTIR Y ADMÍN DESK) - 7 SPAN */}
        {currentRoleView === "admin" && (
          <div className="lg:col-span-7 space-y-6">
            {!isAdminAuthenticated ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden space-y-5 shadow-xl text-left"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/5 rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2.5 bg-red-600/10 text-red-500 rounded-lg">
                    <Lock className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Acceso Administrador Regulado</h3>
                    <p className="text-slate-455 text-[9px] font-mono leading-none mt-0.5">SISTEMA INTEGRADO DE GESTIÓN (S.I.G.)</p>
                  </div>
                </div>

                <p className="text-slate-350 text-xs leading-relaxed">
                  Ingrese el PIN de acceso oficial para ingresar a la nómina de operarios, visualizar firmas digitales registradas, emitir credenciales y administrar la difusión de la empresa.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (adminPinInput === ADMIN_PIN_DEFAULT) {
                      setIsAdminAuthenticated(true);
                      sessionStorage.setItem("azilut_admin_authorized", "true");
                      setAdminPinError("");
                    } else {
                      setAdminPinError("Código de acceso incorrecto. Verifique con el encargado del S.I.G.");
                    }
                  }}
                  className="space-y-4 max-w-sm"
                >
                  <div>
                    <label className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block mb-1">PIN DE ACCESO</label>
                    <input
                      type="password"
                      required
                      value={adminPinInput}
                      onChange={(e) => {
                        setAdminPinInput(e.target.value);
                        setAdminPinError("");
                      }}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-red-500/80 rounded-xl px-4 py-3 text-sm w-full text-slate-200 font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all text-center"
                      placeholder="••••"
                      maxLength={6}
                    />
                    {adminPinError && (
                      <p className="text-[11px] text-red-400 mt-2 font-mono flex items-center gap-1 leading-normal">
                        ⚠️ {adminPinError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-650 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-red-750/15"
                  >
                    <Lock className="w-3.5 h-3.5 text-red-200" />
                    Validar PIN Director
                  </button>
                  
                  <p className="text-[9.5px] text-slate-500 text-center font-mono leading-normal pt-1">
                    PIN por defecto para desarrollo o entrega: <span className="text-slate-450 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{ADMIN_PIN_DEFAULT}</span>
                  </p>
                </form>
              </motion.div>
            ) : (
              <>
                {/* CONSOLA DE ALTA DE OPERARIOS (ADMINISTRADOR) */}
                <div className={`bg-slate-900/80 border ${editingWorkerId ? 'border-red-500/30 shadow-lg shadow-red-950/5' : 'border-slate-800'} p-6 rounded-2xl relative overflow-hidden space-y-4 transition-all duration-300`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/5 rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-all ${editingWorkerId ? 'bg-red-500/15 text-red-450 animate-pulse' : 'bg-red-650/10 text-red-500'}`}>
                        <Users className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          {editingWorkerId ? "Modificar Datos de Operario" : "Consola de Alta de Operarios"}
                        </h3>
                        <p className="text-slate-450 text-[10px] font-mono leading-none mt-0.5">
                          {editingWorkerId ? "EDICIÓN EN TIEMPO REAL ONLINE" : "REGISTRO DE NÓMINA INDUCCIÓN"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-block bg-red-950/80 text-red-400 border border-red-900/30 text-[10px] px-2.5 py-1 rounded font-mono uppercase font-extrabold shadow-sm">Administrador</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminAuthenticated(false);
                          sessionStorage.removeItem("azilut_admin_authorized");
                          setAdminPinInput("");
                        }}
                        className="bg-slate-950 hover:bg-slate-850 text-red-400 hover:text-red-350 border border-slate-800 hover:border-slate-750 px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase font-bold flex items-center gap-1.5 cursor-pointer transition-all h-7 shadow"
                        title="Bloquear panel de administrador"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Bloquear</span>
                      </button>
                    </div>
                  </div>
              
              <p className="text-slate-350 text-xs leading-relaxed">
                {editingWorkerId 
                  ? "Modifique la información del operario seleccionado. Al confirmar con 'Guardar', la base de datos se actualizará de manera online e inmediata, sincronizándolo con sus firmas y accesos autorizados."
                  : "Registre nuevos operarios para incorporarlos a la nómina del proyecto. Automáticamente se generará su PIN de acceso para que puedan loguearse desde su celular/dispositivo de manera offline."}
              </p>

              {/* FORMULARIO DE ALTA */}
              <form onSubmit={handleRegisterWorker} className={`bg-slate-950 p-4 rounded-xl border ${editingWorkerId ? 'border-red-500/40 shadow-sm shadow-red-950/10' : 'border-slate-855'} grid grid-cols-1 md:grid-cols-2 gap-3 text-xs transition-colors duration-300`}>
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block mb-1">APELLIDO Y NOMBRE</label>
                  <input 
                    type="text" 
                    required
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="Ej: Marcelo Gómez"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block mb-1">DNI (NUMERO)</label>
                  <input 
                    type="text" 
                    required
                    value={newWorkerDni}
                    onChange={(e) => setNewWorkerDni(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 30567890"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block mb-1">OFICIO / PUESTO LABORAL</label>
                  <input 
                    type="text" 
                    required
                    value={newWorkerPuesto}
                    onChange={(e) => setNewWorkerPuesto(e.target.value)}
                    placeholder="Ej: Operario de Obra"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block mb-1">OBRA CORRESPONDIENTE</label>
                  <input 
                    type="text" 
                    required
                    value={newWorkerObra}
                    onChange={(e) => setNewWorkerObra(e.target.value)}
                    placeholder="Ej: YPF Planta La Plata"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block mb-1">DURACIÓN ESTIMADA DE LA OBRA</label>
                  <input 
                    type="text" 
                    required
                    value={newWorkerDuracion}
                    onChange={(e) => setNewWorkerDuracion(e.target.value)}
                    placeholder="Ej: 6 meses"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-medium"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 items-end pt-3 border-t border-slate-900 mt-2">
                  <div>
                    <label className="text-[9px] font-mono text-slate-450 tracking-wider block mb-1 uppercase flex items-center gap-1.5 font-bold">
                      <Key className="w-3.5 h-3.5 text-amber-500" /> PIN de Acceso
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={newWorkerPin}
                        onChange={(e) => setNewWorkerPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ej: 1234"
                        className="w-1/3 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500 tracking-widest text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setNewWorkerPin(Math.floor(1000 + Math.random() * 9000).toString())}
                        className="w-1/3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 text-[9px] py-2 rounded-lg font-mono transition-all cursor-pointer font-bold uppercase tracking-tight flex items-center justify-center gap-1"
                        title="Generar PIN aleatorio de 4 dígitos"
                      >
                        Generar PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (newWorkerDni) {
                            setNewWorkerPin(newWorkerDni);
                          } else {
                            alert("Por favor ingrese el número de DNI primero.");
                          }
                        }}
                        className="w-1/3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 text-[9px] py-2 rounded-lg font-mono transition-all cursor-pointer font-bold uppercase tracking-tight flex items-center justify-center gap-1"
                        title="Usar el número de DNI completo del operario como su PIN"
                      >
                        Usar DNI
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingWorkerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWorkerId(null);
                          setNewWorkerName("");
                          setNewWorkerDni("");
                          setNewWorkerPuesto("");
                          setNewWorkerObra("");
                          setNewWorkerDuracion("6 meses");
                          setNewWorkerPin(Math.floor(1000 + Math.random() * 9000).toString());
                        }}
                        className="w-1/2 bg-slate-905 hover:bg-slate-850 text-slate-400 font-bold py-2 rounded-lg border border-slate-800 hover:border-slate-705 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer h-10 uppercase tracking-wider"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`${editingWorkerId ? 'w-1/2 bg-amber-655 hover:bg-amber-600 text-slate-950 shadow-amber-950/10' : 'w-full bg-red-650 hover:bg-red-700 text-white shadow-red-750/15'} font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer h-10 uppercase tracking-wider`}
                    >
                      {editingWorkerId ? (
                        <>
                          <Check className="w-4 h-4" />
                          Guardar Cambios
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Dar de Alta Operario
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* LISTA DE TRABAJADORES EN BASE DE DATOS */}
              <div className="space-y-2 pt-1 font-sans">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Operarios Registrados ({workers.length})</span>
                  <span className="text-[9px] text-slate-500 italic">Haz click en el PIN para loguearlo de inmediato</span>
                </div>

                <div className="max-h-[220px] overflow-y-auto bg-slate-950 border border-slate-850 rounded-xl divide-y divide-slate-850/60 custom-scrollbar">
                  {workers.map(w => {
                    const sigData = signatures.find(s => s.workerDni === w.dni || s.workerId === w.id);
                    const hasSigned = !!sigData;
                    return (
                      <div key={w.id} className="p-3 text-xs hover:bg-slate-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all">
                        <div className="truncate max-w-full md:max-w-[70%]">
                          <div className="text-[12px] font-bold text-white uppercase flex items-center gap-2">
                            {w.fullName}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3.5 text-[9.5px] text-slate-400 mt-1">
                            <span className="truncate"><strong>DNI:</strong> {w.dni}</span>
                            <span className="truncate"><strong>OFICIO / PUESTO:</strong> {w.puesto}</span>
                            <span className="truncate"><strong>OBRA:</strong> {w.obra}</span>
                            <span className="truncate"><strong>DURACIÓN:</strong> {w.duracion || "6 meses"}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {hasSigned ? (
                              <>
                                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-900/30 text-[8px] px-2 py-0.5 rounded font-mono uppercase font-bold flex items-center gap-1 shadow-sm shadow-emerald-950">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Inducción Registrada
                                </span>
                                <button
                                  onClick={() => setSelectedWorkerSignature(sigData)}
                                  className="bg-slate-900 hover:bg-slate-850 hover:text-blue-300 text-blue-400 border border-slate-800 text-[8.5px] px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Ver la credencial y la firma del operario"
                                >
                                  <Eye className="w-2.5 h-2.5 text-blue-400" /> Ver Credencial
                                </button>
                              </>
                            ) : (
                              <span className="bg-slate-900/60 text-slate-500 border border-slate-850/65 text-[8px] px-2 py-0.5 rounded font-mono uppercase font-bold flex items-center gap-1">
                                ⏳ Firma Pendiente
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => {
                              setEditingWorkerId(w.id);
                              setNewWorkerName(w.fullName);
                              setNewWorkerDni(w.dni);
                              setNewWorkerPuesto(w.puesto);
                              setNewWorkerObra(w.obra);
                              setNewWorkerDuracion(w.duracion || "6 meses");
                              setNewWorkerPin(w.pin);
                            }}
                            className={`p-1.5 rounded transition-all cursor-pointer ${
                              editingWorkerId === w.id 
                                ? 'text-amber-500 bg-amber-950/40 border border-amber-900/30' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent'
                            }`}
                            title="Editar datos de este operario"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setCurrentUser(w);
                              setCurrentTab("booklet");
                            }}
                            className="bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded font-mono text-[10.5px] tracking-widest flex items-center gap-1 cursor-pointer"
                            title="Iniciar Sesión rápida con este operario"
                          >
                            <Key className="w-3.5 h-3.5 text-slate-500" /> {w.pin}
                          </button>
                          
                          <button
                            onClick={() => handleRemoveWorker(w.id)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/20 transition-all cursor-pointer"
                            title="Dar de baja en sistema"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PUENTE DE INTEGRACIÓN PARA OTRAS APLICACIONES */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-dashed border-slate-800 space-y-2 mt-3 text-[11px]">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-red-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" /> Puente de Datos e Integración
                    </span>
                    <span className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-mono">PUENTES LISTOS</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-snug">
                    Use estos accesos rápidos para copiar la información completa de la nómina formateada exactamente para otras planillas Excel, sistemas corporativos o integraciones externas:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        const csvContent = "APELLIDO Y NOMBRE;DNI (NUMERO);OFICIO/PUESTO LABORAL;OBRA CORRESPONDIENTE;DURACIÓN ESTIMADA DE LA OBRA;PIN\n" + 
                          workers.map(w => `"${w.fullName}";"${w.dni}";"${w.puesto}";"${w.obra}";"${w.duracion || "6 meses"}";"${w.pin}"`).join("\n");
                        handleCopy(csvContent, "csv-bridge");
                      }}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all text-[10px] cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                      {copiedText === "csv-bridge" ? "Copiado a Excel (CSV)" : "Puente CSV (Excel)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const renamedWorkers = workers.map(w => ({
                          "APELLIDO Y NOMBRE": w.fullName,
                          "DNI (NUMERO)": w.dni,
                          "OFICIO/PUESTO LABORAL": w.puesto,
                          "OBRA CORRESPONDIENTE": w.obra,
                          "DURACIÓN ESTIMADA DE LA OBRA": w.duracion || "6 meses",
                          "PIN": w.pin
                        }));
                        handleCopy(JSON.stringify(renamedWorkers, null, 2), "json-bridge");
                      }}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all text-[10px] cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5 text-blue-500 font-bold" />
                      {copiedText === "json-bridge" ? "Copiado JSON" : "Puente JSON"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AUDITORÍA DE FIRMAS DIGITALES ONLINE */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-650/5 rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-650/10 text-emerald-400 rounded-lg">
                    <FileCheck2 className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Auditoría de Firmas Digitales Online</h3>
                    <p className="text-slate-450 text-[10px] font-mono">REGISTRO DE VALIDACIÓN EN TIEMPO REAL (NUBE)</p>
                  </div>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/30 text-[10px] px-2.5 py-0.5 rounded font-mono uppercase font-extrabold shadow-sm">Nube Activa</span>
              </div>
              
              <p className="text-slate-350 text-xs leading-relaxed">
                Cada vez que un operario acepta los 21 puntos y asienta su firma en el simulador móvil, se sincroniza inmediatamente un acta oficial de conformidad, con su código criptográfico de verificación, fecha, y datos correspondientes de obra.
              </p>

              <div className="max-h-[220px] overflow-y-auto bg-slate-950 border border-slate-850 rounded-xl divide-y divide-slate-850/60 custom-scrollbar">
                {signatures.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    NO SE REGISTRAN FIRMAS ONLINE AÚN.<br />
                    Complete la firma en la estación del operario para sincronizar.
                  </div>
                ) : (
                  signatures.map(sig => (
                    <div key={sig.id} className="p-3 text-xs hover:bg-slate-900/40 flex justify-between items-center transition-all">
                      <div className="truncate max-w-[70%]">
                        <div className="text-[12px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                          <span>{sig.workerName}</span>
                          <span className="text-[8px] bg-emerald-950 text-emerald-450 px-1.5 py-0.2 rounded font-mono uppercase font-normal border border-emerald-900/20">Firmado</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 text-[10px] text-slate-400 mt-1">
                          <span className="truncate"><strong>DNI (NUMERO):</strong> {sig.workerDni}</span>
                          <span className="truncate"><strong>OFICIO / PUESTO LABORAL:</strong> {sig.workerRole}</span>
                          <span className="truncate"><strong>OBRA CORRESPONDIENTE:</strong> {sig.workName}</span>
                          <span className="truncate"><strong>DURACIÓN ESTIMADA DE LA OBRA:</strong> {sig.workDuration}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold block text-center mb-1">
                            {sig.certificateCode}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono block">
                            {new Date(parseInt(sig.id.replace('sig-', '')) || Date.now()).toLocaleTimeString()} - {new Date(parseInt(sig.id.replace('sig-', '')) || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setSignatureToDelete(sig.id)}
                          className="text-red-400 hover:text-red-350 p-1.5 rounded hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Eliminar esta Acta/Credencial permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECCIÓN 1: RECOMENDACIÓN DIGITAL DE FORMATOS DE COMPARTIR */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600/10 text-red-500 rounded-xl">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Estrategia de Difusión del Manual de Bolsillo</h3>
                <p className="text-slate-400 text-sm leading-relaxed mt-1">
                  La nueva Gerencia busca eficiencia. Compartir el manual de bolsillo interactivo por <strong>WhatsApp de Obra</strong> y por <strong>Correo Corporativo HTML</strong> son los dos mejores canales. Aquí tienes las herramientas premium listas para usar:
                </p>
              </div>
            </div>

            {/* TABULACIÓN DE COMPARTIR */}
            <div className="mt-6 col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* WHATSAPP CONTAINER COPIER */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Canal 1. WhatsApp / SMS / Telegram</span>
                    <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono">Alta Lectura (98%)</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Mensaje Dinámico de Obra</h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">
                    Incluye negritas de WhatsApp y el link directo al dispositivo móvil del operario en el obrador.
                  </p>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 mb-3 text-xs text-slate-300 font-mono max-h-[140px] overflow-y-auto whitespace-pre-wrap select-all">
                    {waMessageText}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Selector rápido de plantilla para WhatsApp */}
                  <div className="flex gap-2">
                    {WHATS_APP_TEMPLATES.map(temp => (
                      <button
                        key={temp.id}
                        onClick={() => setSelectedWaTemplate(temp.id)}
                        className={`text-[9.5px] px-2 py-1 rounded border font-sans ${
                          selectedWaTemplate === temp.id 
                            ? "bg-emerald-950 border-emerald-800 text-emerald-400" 
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        {temp.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleCopy(waMessageText, "wa")}
                      className="flex-1 bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedText === "wa" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText === "wa" ? "¡Mensaje Copiado!" : "Copiar Texto Directo"}
                    </button>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(waMessageText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-all text-xs font-bold flex items-center gap-1 shadow shadow-emerald-700/10"
                      title="Compartir por WhatsApp Web"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Probar Envío
                    </a>
                  </div>
                </div>
              </div>

              {/* EMAIL MAILING COMPONENT */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Canal 2. Correo Corporativo</span>
                    <span className="bg-blue-950 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-mono">MailChimp / Outlook</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Boletín Oficial Integrado HTML</h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">
                    Boletín HTML autoadaptable de etiqueta premium para notificación y auditoría con los colores oficiales de Azilut S.A.
                  </p>

                  <div className="space-y-1.5">
                    <div className="text-[9.5px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-900 p-1.5 rounded border border-slate-800">
                      <Mail className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate">Asunto: {emailSubject}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-2 border-t border-slate-900">
                  <div className="p-2.5 bg-slate-900 rounded-lg text-slate-500 font-mono text-[8px] max-h-[85px] overflow-y-auto block leading-tight border border-slate-850">
                    {EMAIL_TEMPLATE_HTML.substring(0, 300) + "\n\n/* ... código de diseño autoadaptable de Azilut ... */"}
                  </div>

                  <button
                    onClick={() => {
                      const completeTemp = EMAIL_TEMPLATE_HTML.replace("[URL_DEL_MANUAL]", customAppLink);
                      handleCopy(completeTemp, "html");
                      setCopyHtmlClicked(true);
                      setTimeout(() => setCopyHtmlClicked(false), 3000);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {copiedText === "html" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>¡Código HTML Copiado!</span>
                      </>
                    ) : (
                      <>
                        <CodeIcon className="w-3.5 h-3.5" />
                        <span>Copiar Código HTML Adaptable</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* URL SETTING AT BASE OF COMPONENT */}
            <div className="mt-4 bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-red-500" />
                <span className="text-slate-300 font-sans"><strong>Simula tu Link Oficial para la difusición:</strong></span>
              </div>
              <div className="flex-grow max-w-sm">
                <input 
                  type="text" 
                  value={customAppLink}
                  onChange={(e) => setCustomAppLink(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11.5px] w-full text-slate-200 font-mono focus:outline-none focus:border-red-500"
                  placeholder="Insertar URL para las plantillas"
                />
              </div>
            </div>

          </div>

          {/* SECCIÓN 2: CALCULADOR DE IMPACTO ECOLÓGICO Y MONETARIO DE DIFUSIÓN DE BOLSILLO */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-650/10 text-emerald-500 rounded-lg">
                  <FileSpreadsheet className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Calculador de Retorno de Inversión (ROI)</h3>
                  <p className="text-slate-400 text-xs font-mono">SIMULACIÓN DE IMPACTO DE DIGITALIZACIÓN DE AZILUT S.A.</p>
                </div>
              </div>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold">ECO - Friendly</span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              Ajusta el personal total a capacitar de la Empresa para dimensionar el ahorro monetario, ecológico, logístico y de horas de administración al reemplazar el papel físico:
            </p>

            {/* SLIDER DE COMUNIDAD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-850 mb-6">
              <div className="col-span-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans font-bold text-slate-300">Nómina del Proyecto (Trabajadores):</span>
                  <span className="text-red-500 font-mono font-extrabold text-sm">{rosterSize} colab.</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="1200" 
                  step="10" 
                  value={rosterSize}
                  onChange={(e) => setRosterSize(parseInt(e.target.value))}
                  className="w-full accent-red-650 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none mt-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Método Previo</label>
                <div className="text-xs font-bold text-slate-300 bg-slate-900 px-2 py-1.5 rounded border border-slate-800">Carpeta Física con firmas</div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Sustituto Premium</label>
                <div className="text-xs font-bold text-emerald-450 bg-emerald-950/20 px-2 py-1.5 rounded border border-emerald-900/20 flex items-center gap-1">
                  🌐 Suite Móvil PWA
                </div>
              </div>
            </div>

            {/* INDICADORES DEL CALCULO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative overflow-hidden">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Papel & Resmas Ahorradas</div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono flex items-baseline gap-1">
                  {papersSaved.toLocaleString()} 
                  <span className="text-xs font-normal text-slate-450 uppercase">hojas</span>
                </div>
                <p className="text-[9.5px] text-slate-550 mt-1 leading-tight">Calculado sobre 4 hojas A4 por trabajador (3 de políticas + 1 de firma). Equivale a {Math.round(papersSaved / 500)} resmas.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative overflow-hidden">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Tiempo de Productividad Optimizado</div>
                <div className="text-2xl font-extrabold text-amber-500 mt-2 font-mono flex items-baseline gap-1">
                  {Math.round(processHoursSaved)}
                  <span className="text-xs font-normal text-slate-450 uppercase">Hs</span>
                </div>
                <p className="text-[9.5px] text-slate-550 mt-1 leading-tight">Tiempo total de lectura, comprensión y firma física optimizado sobre un promedio de 2 hs por persona.</p>
              </div>

            </div>
          </div>

          {/* SECCIÓN 3: ESTRUCTURA DEL MANUAL DE GESTIÓN CORPORATIVO */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-base font-extrabold text-white mb-3">Estructura del Manual de Gestión S.A.</h3>
            <p className="text-slate-350 text-xs leading-relaxed mb-4">
              Cada anexo representa un valor fundamental de Azilut S.A. Aquí se demuestra cómo el diseño digital interactivo mejora el acceso a normativas clave:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div onClick={() => { setSelectedPolicyId("politica-integrada"); setCurrentTab("booklet"); }} className="p-3.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-900 rounded-xl cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-lg bg-red-650/10 text-red-500 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-450 uppercase tracking-wider block">ANEXO III</span>
                <span className="text-xs font-extrabold text-white leading-tight block mt-0.5">Política Integrada</span>
                <p className="text-[9px] text-slate-405 mt-1 leading-relaxed leading-snug">Calidad, seguridad vial, salud y protección ambiental en cada obrador de la empresa.</p>
              </div>

              <div onClick={() => { setSelectedPolicyId("alcohol-drogas"); setCurrentTab("booklet"); }} className="p-3.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-900 rounded-xl cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-lg bg-amber-655/10 text-amber-500 flex items-center justify-center mb-2">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-455 uppercase tracking-wider block">ANEXO III.A</span>
                <span className="text-xs font-extrabold text-white leading-tight block mt-0.5">Alcohol & Drogas</span>
                <p className="text-[9px] text-slate-405 mt-1 leading-relaxed leading-snug">Tolerancia Cero. Exámenes clínicos de ingreso y cesantía automática por alteraciones.</p>
              </div>

              <div onClick={() => { setSelectedPolicyId("conduccion-vehicular"); setCurrentTab("booklet"); }} className="p-3.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-900 rounded-xl cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-650/10 text-blue-500 flex items-center justify-center mb-2">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-450 uppercase tracking-wider block">ANEXO III.B</span>
                <span className="text-xs font-extrabold text-white leading-tight block mt-0.5">Conducción Segura</span>
                <p className="text-[9px] text-slate-405 mt-1 leading-relaxed leading-snug">Defensa vial, seguros al día, habilitación nacional y pautas previas a iniciar marcha.</p>
              </div>
            </div>
          </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-950/90 border-t border-slate-850 py-8 px-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
          <div>
            <span className="font-extrabold text-sm tracking-widest text-slate-300">AZILUT S.A.</span>
            <span className="text-[10px] text-slate-500 block mt-1">Manual de Gestión Integrado • Derechos Reservados © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 font-mono text-[11px]">
            <span>Estilo: Corporativo Premium</span>
            <span>Versión: 1.8.4 Mobile-Responsive</span>
          </div>
        </div>
      </footer>

      {/* AUDIT MODAL FOR SELECTED WORKER SIGNATURE */}
      <AnimatePresence>
        {selectedWorkerSignature && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedWorkerSignature(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all text-xs bg-slate-950/80 p-1 rounded-full border border-slate-800 cursor-pointer"
                title="Cerrar vista de credencial"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Expediente de Inducción Digital</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Control de Cumplimiento Online — AZILUT S.A.</p>
                </div>
              </div>

              {/* CARD PREVIEW */}
              <div className="w-full bg-white text-slate-900 rounded-xl p-4 text-left relative premium-paper-bg shadow-lg border border-slate-300">
                <div className="absolute top-0 right-0 px-2 py-0.5 font-mono text-[7px] text-slate-400 bg-slate-105 rounded-bl-lg border-l border-b border-slate-200 uppercase font-bold">
                  Código: {selectedWorkerSignature.certificateCode}
                </div>

                <div className="border-b border-dashed border-slate-300 pb-2 mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-red-650 text-white font-extrabold text-[9px] rounded flex items-center justify-center">A</span>
                  <div>
                    <span className="font-extrabold text-[9.5px] tracking-wider block text-slate-900 leading-none">AZILUT S.A.</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-900 text-xs">
                  <div>
                    <div className="text-[6.5px] font-mono text-slate-500 leading-none">APELLIDO Y NOMBRE DEL COLABORADOR</div>
                    <div className="text-[11px] font-extrabold uppercase leading-none mt-0.5">{selectedWorkerSignature.workerName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <div className="text-[6.5px] font-mono text-slate-500 leading-none">DNI</div>
                      <div className="text-[9px] font-bold font-mono text-slate-800 mt-0.5">{selectedWorkerSignature.workerDni}</div>
                    </div>
                    <div>
                      <div className="text-[6.5px] font-mono text-slate-500 leading-none">OFICIO / PUESTO</div>
                      <div className="text-[9px] font-bold text-slate-800 truncate mt-0.5">{selectedWorkerSignature.workerRole}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-slate-100 mt-1">
                    <div>
                      <div className="text-[6.5px] font-mono text-slate-500 leading-none">DURACIÓN ESTIMADA</div>
                      <div className="text-[9px] font-bold text-slate-800 mt-0.5">{selectedWorkerSignature.workDuration}</div>
                    </div>
                    <div>
                      <div className="text-[6.5px] font-mono text-slate-500 leading-none">OBRA CORRESPONDIENTE</div>
                      <div className="text-[9px] font-bold text-slate-800 truncate mt-0.5">{selectedWorkerSignature.workName}</div>
                    </div>
                  </div>

                  <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200 mt-1.5 text-[7px] text-slate-600 leading-tight">
                    ✓ Aprobación conforme del Reglamento General de Trabajo y Anexos Integrados, firmado digitalmente de forma unívoca y voluntaria.
                  </div>

                  {/* SIGNATURE RENDERS */}
                  <div className="border-t border-dashed border-slate-300 pt-2 mt-2.5 flex justify-between items-end">
                    <div>
                      <span className="text-[6.5px] font-mono text-slate-500 block leading-none mb-1">RÚBRICA DIGITAL FIRMADA</span>
                      {selectedWorkerSignature.signatureImg ? (
                        <div className="h-10 w-28 bg-slate-50 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                          <img src={selectedWorkerSignature.signatureImg} alt="Firma real" className="h-[95%] w-auto object-contain max-w-full" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="h-6 w-24 bg-slate-50 rounded border border-slate-200/50 flex items-center justify-center font-mono text-[7px] text-slate-400 italic">
                          [ Rúbrica Almacenada ]
                        </div>
                      )}
                    </div>
                    
                    <div className="text-[7.5px] font-mono text-slate-400 text-right uppercase">
                      Registro Digital
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex gap-2 mt-4 text-xs">
                <button
                  onClick={() => handleDownloadSelectedWorkerCredential(selectedWorkerSignature)}
                  className="flex-1 bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Descargar Credencial (PNG)
                </button>
                <button
                  onClick={() => setSelectedWorkerSignature(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold py-2 px-4 rounded-lg transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE CONFIRMACIÓN PARA BAJA DE OPERARIO */}
      <AnimatePresence>
        {workerToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left"
            >
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Confirmar Baja</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  ¿Está seguro de que desea dar de baja al operario{" "}
                  <strong className="text-white">
                    {workers.find((w) => w.id === workerToDelete)?.fullName || "este operario"}
                  </strong>{" "}
                  en el sistema online? Ya no se le permitirá iniciar sesión con su PIN.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkerToDelete(null)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = workerToDelete;
                    setWorkerToDelete(null);
                    try {
                      await deleteDoc(doc(db, "workers", id));
                      if (currentUser?.id === id) {
                        setCurrentUser(null);
                      }
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `workers/${id}`);
                    }
                  }}
                  className="py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-red-700/25"
                >
                  Dar de baja
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE CONFIRMACIÓN PARA BORRAR CREDENCIAL DE FIRMA */}
      <AnimatePresence>
        {signatureToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left"
            >
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Eliminar Credencial</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  ¿Está seguro de que desea eliminar permanentemente el Acta de conformidad / Credencial del operario{" "}
                  <strong className="text-white">
                    {signatures.find((s) => s.id === signatureToDelete)?.workerName || "el operario"}
                  </strong>? Esto removerá el registro del sistema online.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSignatureToDelete(null)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = signatureToDelete;
                    setSignatureToDelete(null);
                    try {
                      await deleteDoc(doc(db, "signatures", id));
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `signatures/${id}`);
                    }
                  }}
                  className="py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-red-700/25"
                >
                  Confirmar Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple layout support icon missing in lucide-react standard declarations
function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
