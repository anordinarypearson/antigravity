import jsPDF from 'jspdf';

export async function exportConversationAsMarkdown(
    messages: Array<{ role: string; content: string }>,
    title: string = 'Chat Conversation'
): Promise<string> {
    let markdown = `# ${title}\n\n`;
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    for (const message of messages) {
        const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
        markdown += `## ${role}\n\n${message.content}\n\n---\n\n`;
    }

    return markdown;
}

export function downloadMarkdown(content: string, filename: string = 'conversation.md') {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function downloadJSON(data: any, filename: string = 'data.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export async function exportConversationAsPDF(
    messages: Array<{ role: string; content: string }>,
    title: string = 'Chat Conversation'
): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.text(title, 20, yPosition);
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Messages
    doc.setTextColor(0, 0, 0);
    for (const message of messages) {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }

        // Role
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const role = message.role === 'user' ? 'User' : 'Assistant';
        doc.text(role, 20, yPosition);
        yPosition += 7;

        // Content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(message.content, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 10;
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
