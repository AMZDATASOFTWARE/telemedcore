import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Download, FileX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import 'moment/locale/pt-br';
import jsPDF from 'jspdf';

moment.locale('pt-br');

const TIPO_ICONS = {
  'Receita': '💊',
  'Atestado': '📋',
  'Pedido de Exame': '🔬',
  'Laudo': '📄',
  'Encaminhamento': '🏥',
};

const TIPO_COLORS = {
  'Receita': 'bg-blue-100 text-blue-800',
  'Atestado': 'bg-green-100 text-green-800',
  'Pedido de Exame': 'bg-purple-100 text-purple-800',
  'Laudo': 'bg-amber-100 text-amber-800',
  'Encaminhamento': 'bg-pink-100 text-pink-800',
};

function downloadDocPDF(doc, medico, paciente) {
  const pdf = new jsPDF();
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 20;

  pdf.setFillColor(37, 99, 200);
  pdf.rect(0, 0, pageW, 28, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MedConnect Telemedicina', margin, 12);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Dr(a). ${medico?.nome || ''} | CRM: ${medico?.crm || 'N/I'}`, margin, 22);

  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(doc.tipo?.toUpperCase() || 'DOCUMENTO', pageW / 2, 45, { align: 'center' });

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, 50, pageW - margin, 50);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Paciente: ${paciente?.nome || 'N/I'}`, margin, 62);
  pdf.text(`Data: ${moment(doc.created_date).format('DD/MM/YYYY')}`, margin, 70);
  pdf.line(margin, 76, pageW - margin, 76);

  pdf.setFontSize(11);
  pdf.text('Documento gerado eletronicamente via MedConnect.', margin, 90);
  if (doc.assinatura_digital) {
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Hash de autenticidade: ${doc.assinatura_digital}`, margin, 100);
  }

  const sigY = 230;
  pdf.setTextColor(30, 30, 30);
  pdf.setDrawColor(100, 100, 100);
  pdf.line(margin + 40, sigY, pageW - margin - 40, sigY);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Dr(a). ${medico?.nome || ''}`, pageW / 2, sigY + 6, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.text(`CRM: ${medico?.crm || 'N/I'}`, pageW / 2, sigY + 13, { align: 'center' });

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Gerado em ${moment().format('DD/MM/YYYY HH:mm')}`, pageW / 2, 285, { align: 'center' });

  pdf.save(`${doc.tipo}_${moment(doc.created_date).format('DDMMYYYY')}.pdf`);
}

export default function MeusDocumentos({ paciente }) {
  const [documentos, setDocumentos] = useState([]);
  const [medicos, setMedicos] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const docs = await base44.entities.Documento.filter({ id_paciente: paciente.id });
        const sorted = docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setDocumentos(sorted);

        const ids = [...new Set(docs.map(d => d.id_medico).filter(Boolean))];
        const map = {};
        await Promise.all(ids.map(async id => {
          const res = await base44.entities.UsuarioTelemed.filter({ id });
          if (res[0]) map[id] = res[0];
        }));
        setMedicos(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [paciente.id]);

  const tipos = ['Todos', ...new Set(documentos.map(d => d.tipo).filter(Boolean))];
  const lista = filtro === 'Todos' ? documentos : documentos.filter(d => d.tipo === filtro);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Carregando documentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtro por tipo */}
      {tipos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {lista.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileX className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum documento encontrado</p>
          <p className="text-sm mt-1">Seus documentos médicos aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(doc => {
            const medico = medicos[doc.id_medico];
            return (
              <div key={doc.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-2xl">
                  {TIPO_ICONS[doc.tipo] || '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLORS[doc.tipo] || 'bg-muted text-muted-foreground'}`}>
                      {doc.tipo}
                    </span>
                    {doc.valido && (
                      <span className="text-xs text-emerald-600 font-medium">✓ Válido</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    Dr(a). {medico?.nome || 'Médico'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {moment(doc.created_date).format('D [de] MMMM [de] YYYY')}
                  </p>
                </div>
                <button
                  onClick={() => downloadDocPDF(doc, medico, paciente)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}