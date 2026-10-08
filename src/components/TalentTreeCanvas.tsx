import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TalentNode } from '../types/game';
import { audioSys } from '../audio/soundEngine';

interface TalentTreeCanvasProps {
  talents: TalentNode[];
  pearls: number;
  crystals: number;
  onUpgrade: (talentId: string) => void;
}

export const TalentTreeCanvas: React.FC<TalentTreeCanvasProps> = ({
  talents,
  pearls,
  crystals,
  onUpgrade,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TalentNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const getCategoryColor = (category: TalentNode['category']) => {
    switch (category) {
      case 'survival':
        return '#00e676'; // vibrant green
      case 'laser':
        return '#ff3366'; // neon crimson
      case 'cargo':
        return '#ffb300'; // warm amber
      case 'tech':
        return '#00f0ff'; // cyber cyan
    }
  };

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(25, 55, 80, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 1. Draw connection lines
    talents.forEach((node) => {
      node.req.forEach((reqId) => {
        const parent = talents.find((t) => t.id === reqId);
        if (parent) {
          const isParentUnlocked = parent.lvl > 0;
          const isChildUnlocked = node.lvl > 0;

          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);

          // Smooth Bezier Curve between nodes
          const midX = (parent.x + node.x) / 2;
          ctx.bezierCurveTo(midX, parent.y, midX, node.y, node.x, node.y);

          if (isChildUnlocked) {
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(0, 255, 204, 0.6)';
            ctx.shadowBlur = 8;
          } else if (isParentUnlocked) {
            ctx.strokeStyle = '#2962ff';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          } else {
            ctx.strokeStyle = '#1e3040';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      });
    });

    // 2. Draw Nodes
    talents.forEach((node) => {
      const isMax = node.lvl >= node.max;
      const canUnlock = node.req.every((reqId) => {
        const p = talents.find((t) => t.id === reqId);
        return p && p.lvl > 0;
      });
      const cost = isMax ? 0 : node.cost(node.lvl);
      const canAfford = node.cur === 'pearls' ? pearls >= cost : crystals >= cost;
      const isAvailable = canUnlock && canAfford && !isMax;

      const catCol = getCategoryColor(node.category);
      const radius = 24;

      // Glow behind available node
      if (isAvailable) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      if (isMax) {
        ctx.fillStyle = '#ffd700'; // Gold
        ctx.strokeStyle = '#fff176';
        ctx.lineWidth = 3;
      } else if (node.lvl > 0) {
        ctx.fillStyle = catCol;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
      } else if (canUnlock) {
        ctx.fillStyle = canAfford ? '#00b0ff' : '#153243';
        ctx.strokeStyle = canAfford ? '#40c4ff' : '#284b63';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = '#0f1f2c';
        ctx.strokeStyle = '#1b3244';
        ctx.lineWidth = 1.5;
      }
      ctx.fill();
      ctx.stroke();

      // Inner icon or category badge dot
      ctx.beginPath();
      ctx.arc(node.x, node.y - 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = catCol;
      ctx.fill();

      // Level text
      ctx.fillStyle = isMax ? '#000' : '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isMax ? 'MAX' : `${node.lvl}/${node.max}`, node.x, node.y + 3);

      // Node Name Label
      ctx.font = '11px sans-serif';
      ctx.fillStyle = node.lvl > 0 ? '#e0f7fa' : canUnlock ? '#90caf9' : '#546e7a';
      ctx.fillText(node.name, node.x, node.y + 36);

      // Currency requirement mini-tag below name
      if (!isMax && canUnlock) {
        ctx.font = '10px monospace';
        ctx.fillStyle = node.cur === 'pearls' ? '#ffd54f' : '#ea80fc';
        const curIcon = node.cur === 'pearls' ? '💰' : '💠';
        ctx.fillText(`${curIcon}${cost}`, node.x, node.y + 50);
      }

      ctx.restore();
    });
  }, [talents, pearls, crystals]);

  useEffect(() => {
    drawTree();
  }, [drawTree]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let found: TalentNode | null = null;
    for (const node of talents) {
      const d = Math.hypot(node.x - mx, node.y - my);
      if (d <= 26) {
        found = node;
        break;
      }
    }

    setHoveredNode(found);
    if (found) {
      setTooltipPos({ x: e.clientX - rect.left + 16, y: e.clientY - rect.top + 16 });
    } else {
      setTooltipPos(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const node of talents) {
      const d = Math.hypot(node.x - mx, node.y - my);
      if (d <= 26) {
        onUpgrade(node.id);
        break;
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
    setTooltipPos(null);
  };

  return (
    <div className="relative w-full h-[460px] bg-[#040e17] rounded-lg border border-[#163044] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={1080}
        height={460}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-pointer block"
      />

      {/* Floating Hover Tooltip */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none bg-[#091b29]/95 backdrop-blur-md border border-[#00f0ff] p-3 rounded shadow-2xl text-xs max-w-xs text-white"
          style={{
            left: Math.min(tooltipPos.x, 820),
            top: Math.min(tooltipPos.y, 320),
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#1b3d54] pb-1.5 mb-1.5">
            <span className="font-bold text-sm text-[#4ef2bb]">{hoveredNode.name}</span>
            <span className="text-gray-400 font-mono">
              {hoveredNode.lvl >= hoveredNode.max ? '滿級' : `等級: ${hoveredNode.lvl}/${hoveredNode.max}`}
            </span>
          </div>
          <p className="text-gray-300 leading-relaxed mb-2">{hoveredNode.desc}</p>

          <div className="pt-1 text-[11px] font-mono border-t border-[#132a3a]">
            {hoveredNode.lvl >= hoveredNode.max ? (
              <span className="text-amber-400 font-semibold">★ 已達到最高階天賦</span>
            ) : (
              <div>
                <span className="text-gray-400">升級費用: </span>
                <span className={hoveredNode.cur === 'pearls' ? 'text-amber-300 font-bold' : 'text-purple-300 font-bold'}>
                  {hoveredNode.cost(hoveredNode.lvl)} {hoveredNode.cur === 'pearls' ? '💰 珍珠' : '💠 星石晶體'}
                </span>
                {hoveredNode.req.length > 0 && (
                  <div className="mt-1 text-gray-400 text-[10px]">
                    前置天賦:{' '}
                    {hoveredNode.req
                      .map((reqId) => {
                        const t = talents.find((x) => x.id === reqId);
                        const ok = t && t.lvl > 0;
                        return `${t?.name || reqId} (${ok ? '✓已解鎖' : '✗未解鎖'})`;
                      })
                      .join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
