import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, HelpCircle } from 'lucide-react';
import moment from 'moment';
import jsPDF from 'jspdf';

const TIPOS = ['Receita', 'Atestado', 'Pedido de Exame', 'Laudo', 'Encaminhamento'];

const MACROS = {
  '%PAC_NOME%': (p, m) => p?.nome || '[Paciente]',
  '%PAC_CPF%': (p, m) => p?.cpf || '[CPF]',
  '%MED_NOME%': (p, m) => m?.nome || '[Médico]',
  '%MED_CRM%': (p, m) => m?.crm || '[CRM]',
  '%MED_ESPECIALIDADE%': (p, m) => m?.especialidade || '[Especialidade]',
  '%DATA%': () => moment().format('DD/MM/YYYY'),
  '%HORA%': () => moment().format('HH:mm'),
};

const MACRO_HELP = Object.keys(MACROS);

function applyMacros(text, paciente, medico) {
  let result = text;
  Object.entries(MACROS).forEach(([macro, fn]) => {
    result = result.replaceAll(macro, fn(paciente, medico));
  });
  return result;
}

function generatePDF(tipo, conteudo, paciente, medico, clinicaNome) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;

  // Header
  doc.setFillColor(37, 99, 200);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicaNome || 'MedConnect Telemedicina', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dr(a). ${medico?.nome || ''} | CRM: ${medico?.crm || 'N/I'} | ${medico?.especialidade || 'Clínica Geral'}`, margin, 22);

  // Tipo do documento
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(tipo.toUpperCase(), pageW / 2, 45, { align: 'center' });

  // Linha divisória
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 50, pageW - margin, 50);

  // Dados do paciente
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', margin, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(paciente?.nome || 'N/I', margin + 25, 62);
  doc.setFont('helvetica', 'bold');
  doc.text('CPF:', margin, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(paciente?.cpf || 'N/I', margin + 12, 70);
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', pageW - 80, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(moment().format('DD/MM/YYYY'), pageW - 60, 62);

  doc.line(margin, 76, pageW - margin, 76);

  // Content
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(conteudo, contentW);
  let y = 88;
  lines.forEach(line => {
    if (y > 250) { doc.addPage(); y = 30; }
    doc.text(line, margin, y);
    y += 7;
  });

  // Signature line
  const sigY = Math.max(y + 20, 220);
  doc.line(margin + 40, sigY, pageW - margin - 40, sigY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr(a). ${medico?.nome || ''}`, pageW / 2, sigY + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`CRM: ${medico?.crm || 'N/I'}`, pageW / 2, sigY + 13, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Documento gerado via MedConnect em ${moment().format('DD/MM/YYYY HH:mm')}`, pageW / 2, 285, { align: 'center' });

  doc.save(`${tipo}_${(paciente?.nome || 'paciente').replace(/ /g, '_')}_${moment().format('DDMMYYYY')}.pdf`);
}

export default function GeradorDocumentos({ agendamento, evolucao, paciente, medico }) {
  const [tipo, setTipo] = useState('Receita');
  const [conteudo, setConteudo] = useState('');
  const [showMacros, setShowMacros] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleInsertMacro(macro) {
    setConteudo(prev => prev + macro);
  }

  async function handleGerar() {
    setSaving(true);
    try {
      const finalText = applyMacros(conteudo, paciente, medico);
      generatePDF(tipo, finalText, paciente, medico, null);

      // Save documento record
      await base44.entities.Documento.create({
        id_evolucao: evolucao?.id || agendamento.id,
        id_paciente: agendamento.id_paciente || '',
        id_medico: medico.id,
        tipo,
        valido: true,
      });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  const preview = applyMacros(conteudo, paciente, medico);

  return (
    <div className="space-y-3 py-2">
      <div>
        <Label className="text-xs">Tipo de Documento</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="mt-1 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Conteúdo do Documento</Label>
          <button
            className="text-xs text-primary flex items-center gap-1 hover:underline"
            onClick={() => setShowMacros(v => !v)}
          >
            <HelpCircle className="w-3 h-3" /> Macros disponíveis
          </button>
        </div>
        {showMacros && (
          <div className="mb-2 p-2 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-1.5">Clique para inserir no texto:</p>
            <div className="flex flex-wrap gap-1">
              {MACRO_HELP.map(macro => (
                <button
                  key={macro}
                  onClick={() => handleInsertMacro(macro)}
                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors font-mono"
                >
                  {macro}
                </button>
              ))}
            </div>
          </div>
        )}
        <Textarea
          rows={7}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder={tipo === 'Receita'
            ? 'Ex: Prescrevemos a %PAC_NOME%:\n- Amoxicilina 500mg — 1 comprimido de 8/8h por 7 dias'
            : tipo === 'Atestado'
            ? 'Atestamos para os devidos fins que %PAC_NOME% esteve sob nossos cuidados na data de %DATA%, necessitando de repouso.'
            : 'Digite o conteúdo do documento...'}
          className="text-sm mt-1"
        />
      </div>

      {conteudo && (
        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Pré-visualização:</p>
          <p className="text-xs text-foreground whitespace-pre-wrap">{preview}</p>
        </div>
      )}

      <Button onClick={handleGerar} disabled={saving || !conteudo.trim()} size="sm" className="w-full">
        <FileDown className="w-3.5 h-3.5 mr-1.5" />
        {saving ? 'Gerando PDF...' : `Gerar ${tipo} (PDF)`}
      </Button>
    </div>
  );
}