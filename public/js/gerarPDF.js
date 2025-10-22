// js/gerarPDF.js

// Função para gerar um ID de sessão único
function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Função para verificar se as bibliotecas necessárias estão carregadas
function verificarBibliotecas() {
    if (typeof window.jspdf === 'undefined') {
        throw new Error('Biblioteca jsPDF não está carregada');
    }
    if (typeof QRCode === 'undefined') {
        throw new Error('Biblioteca QRCode não está carregada');
    }
    return true;
}

// Função principal para gerar o PDF
function gerarPDF() {
    try {
        // Verificar se as bibliotecas estão carregadas
        verificarBibliotecas();
        
        // Obter dados do paciente do localStorage
        const pacienteData = JSON.parse(localStorage.getItem('pacienteSelecionado'));
        
        if (!pacienteData) {
            alert('Nenhum dado de paciente disponível para gerar PDF');
            return;
        }

        // Usar a versão UMD do jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const primaryColor = [15, 82, 186];
        const accentColor = [230, 240, 255];
        const textColor = [50, 50, 50];

        // Funções auxiliares para garantir cores válidas
        const safeSetTextColor = (color) => Array.isArray(color) && color.length === 3
            ? doc.setTextColor(color[0], color[1], color[2])
            : doc.setTextColor(0, 0, 0);

        const safeSetFillColor = (color) => Array.isArray(color) && color.length === 3
            ? doc.setFillColor(color[0], color[1], color[2])
            : doc.setFillColor(255, 255, 255);

        const safeSetDrawColor = (color) => Array.isArray(color) && color.length === 3
            ? doc.setDrawColor(color[0], color[1], color[2])
            : doc.setDrawColor(0, 0, 0);

        const margin = 15;
        const maxWidth = 180;
        let y = 25;

        // Cabeçalho
        safeSetFillColor(accentColor);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        safeSetTextColor(primaryColor);
        doc.text("HEALTHTRACK", 15, 22);
        doc.setFontSize(12);
        safeSetTextColor(textColor);
        doc.text("Relatório Médico - Confidencial", 15, 30);

        safeSetDrawColor(primaryColor);
        doc.setLineWidth(0.7);
        doc.line(margin, 37, 195, 37);
        y = 45;

        // Informações do paciente
        const infoBoxHeight = 70;
        safeSetFillColor([245, 245, 245]);
        safeSetDrawColor(primaryColor);
        doc.roundedRect(margin, y, maxWidth, infoBoxHeight, 3, 3, 'FD');

        const col1 = margin + 5;
        const col2 = 110;
        let lineHeight = 10;

        safeSetTextColor(primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("Nome:", col1, y + lineHeight);
        doc.text("Idade:", col1, y + 2 * lineHeight);
        doc.text("Sexo:", col1, y + 3 * lineHeight);
        safeSetTextColor(textColor);
        doc.setFont("helvetica", "normal");
        doc.text(pacienteData.nome || '--', col1 + 25, y + lineHeight);
        doc.text(pacienteData.idade ? `${pacienteData.idade} anos` : '--', col1 + 25, y + 2 * lineHeight);
        doc.text(pacienteData.sexo || '--', col1 + 25, y + 3 * lineHeight);

        safeSetTextColor(primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("Quarto:", col2, y + lineHeight);
        doc.text("Estadia:", col2, y + 2 * lineHeight);
        doc.text("Alerta:", col2, y + 3 * lineHeight);
        safeSetTextColor(textColor);
        doc.setFont("helvetica", "normal");
        doc.text(String(pacienteData.quarto || '--'), col2 + 25, y + lineHeight);
        doc.text(pacienteData.estadia ? `${pacienteData.estadia} dias` : '--', col2 + 25, y + 2 * lineHeight);
        doc.text(pacienteData.nivelalerta || '--', col2 + 25, y + 3 * lineHeight);

        y += infoBoxHeight + 10;

        // Função para adicionar seções
        const addSection = (title, content) => {
            safeSetFillColor(accentColor);
            doc.roundedRect(margin, y, maxWidth, 12, 2, 2, 'F');
            safeSetTextColor(primaryColor);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(title, margin + 3, y + 8);
            y += 18;

            safeSetTextColor(textColor);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(content || 'Não informado', maxWidth - 4);
            doc.text(lines, margin + 2, y);
            y += lines.length * 8 + 20;
        };

        // Adicionar seções de relatório e prescrição
        addSection("RELATÓRIO CLÍNICO", pacienteData.relatorio);
        addSection("PRESCRIÇÃO MÉDICA", pacienteData.prescricao);

        // Gerar QR Code
        const sessionId = generateSessionId();
        sessionStorage.setItem(sessionId, JSON.stringify({
            patientId: pacienteData.id,
            hospitalId: pacienteData.hospitalId
        }));

        const qrData = `https://healthtrack-p6oq.onrender.com/paciente.html?session=${sessionId}`;

        QRCode.toDataURL(qrData, { width: 70 }, (err, url) => {
            if (!err) {
                safeSetFillColor([255, 255, 255]);
                safeSetDrawColor(primaryColor);
                doc.roundedRect(140, y - 5, 55, 55, 3, 3, 'FD');
                doc.addImage(url, 'JPEG', 145, y, 45, 45);
                safeSetTextColor(primaryColor);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text("ACESSO RÁPIDO", 167.5, y + 45, { align: "center" });
            }

            // Rodapé
            safeSetTextColor([120, 120, 120]);
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, 285);
            safeSetTextColor(primaryColor);
            doc.setFont("helvetica", "bold");
            doc.text("Sistema HealthTrack - Confidencial", 105, 285, { align: "center" });

            // Salvar o PDF
            const safeFileName = `Prontuario_${(pacienteData.nome || 'Paciente').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.pdf`;
            doc.save(safeFileName);
        });

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente. Erro: ' + error.message);
    }
}

// Versão alternativa que tenta carregar as bibliotecas se não estiverem disponíveis
function gerarPDFComFallback() {
    if (typeof window.jspdf === 'undefined' || typeof QRCode === 'undefined') {
        carregarBibliotecas().then(() => {
            gerarPDF();
        }).catch(error => {
            alert('Não foi possível carregar as bibliotecas necessárias: ' + error.message);
        });
    } else {
        gerarPDF();
    }
}

// Função para carregar as bibliotecas dinamicamente se necessário
function carregarBibliotecas() {
    return new Promise((resolve, reject) => {
        // Verificar se já estão carregadas
        if (typeof window.jspdf !== 'undefined' && typeof QRCode !== 'undefined') {
            resolve();
            return;
        }

        let loaded = 0;
        const total = 2;

        function checkLoaded() {
            loaded++;
            if (loaded === total) {
                if (typeof window.jspdf !== 'undefined' && typeof QRCode !== 'undefined') {
                    resolve();
                } else {
                    reject(new Error('Falha ao carregar bibliotecas'));
                }
            }
        }

        // Carregar jsPDF se necessário
        if (typeof window.jspdf === 'undefined') {
            const script1 = document.createElement('script');
            script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script1.onload = checkLoaded;
            script1.onerror = () => reject(new Error('Falha ao carregar jsPDF'));
            document.head.appendChild(script1);
        } else {
            checkLoaded();
        }

        // Carregar QRCode se necessário
        if (typeof QRCode === 'undefined') {
            const script2 = document.createElement('script');
            script2.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
            script2.onload = checkLoaded;
            script2.onerror = () => reject(new Error('Falha ao carregar QRCode'));
            document.head.appendChild(script2);
        } else {
            checkLoaded();
        }
    });
}
