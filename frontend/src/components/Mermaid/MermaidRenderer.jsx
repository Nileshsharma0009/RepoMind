import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Outfit, sans-serif',
  themeVariables: {
    background: '#0a0a0a',
    primaryColor: '#9333ea', // primary HSL color (purple-600)
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#3b0764',
    lineColor: '#404040',
    secondaryColor: '#18181b',
    tertiaryColor: '#09090b',
  },
});

export default function MermaidRenderer({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!chart) return;
    setError(false);
    setRendering(true);

    const id = `mermaid-${Math.floor(Math.random() * 100000)}`;

    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid render failure:', err);
        setError(true);
        // Clear broken element left in DOM by mermaid on error
        const element = document.getElementById(id);
        if (element) element.remove();
      } finally {
        setRendering(false);
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-5 text-center text-xs text-red-400 bg-red-950/10 border border-red-950/20 rounded-xl">
        Failed to render Mermaid diagram. There may be a syntax configuration mismatch.
      </div>
    );
  }

  return (
    <div className="p-6 bg-neutral-900/10 border border-neutral-850 rounded-xl overflow-x-auto flex justify-center shadow-glass-inner min-h-[150px] relative">
      {rendering ? (
        <div className="absolute inset-0 bg-neutral-950/20 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div
          className="w-full flex justify-center text-white"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
}
