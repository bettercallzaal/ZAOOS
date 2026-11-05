'use client';

import type Konva from 'konva';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { creditLine, validateCredits } from '@/lib/cards/credits';
import { EXPORT_SIZES } from '@/lib/cards/export-sizes';
import type {
  CardDraft,
  CardLayer,
  ImageLayer,
  TextLayer,
  ZaoStatsLayer,
} from '@/lib/cards/schema';

// The card itself, drawn with react-konva (MIT, konvajs/react-konva) on konva (MIT).
// Coordinates are card pixels (750x1050); the stage scales them to the screen.

const CARD = EXPORT_SIZES.card;

export type LayerPatch = Partial<Pick<CardLayer, 'x' | 'y' | 'rotation'>> & {
  width?: number;
  height?: number;
  fontSize?: number;
};

interface CardCanvasProps {
  draft: CardDraft;
  displayWidth: number;
  /** fontId -> family string resolved from next/font. */
  fontFamilies: Record<string, string>;
  textColor: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayerChange: (id: string, patch: LayerPatch) => void;
  stageRef: RefObject<Konva.Stage | null>;
}

function useHtmlImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);
  return image;
}

interface ImageNodeProps {
  layer: ImageLayer;
  onSelect: () => void;
  onChange: (patch: LayerPatch) => void;
}

function ImageNode({ layer, onSelect, onChange }: ImageNodeProps) {
  const image = useHtmlImage(layer.src);
  if (!image) return null;
  return (
    <KonvaImage
      id={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      draggable
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        const patch: LayerPatch = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(10, node.width() * node.scaleX()),
          height: Math.max(10, node.height() * node.scaleY()),
        };
        node.scaleX(1);
        node.scaleY(1);
        onChange(patch);
      }}
    />
  );
}

interface TextNodeProps {
  layer: TextLayer;
  fontFamily: string;
  onSelect: () => void;
  onChange: (patch: LayerPatch) => void;
}

function TextNode({ layer, fontFamily, onSelect, onChange }: TextNodeProps) {
  return (
    <Text
      id={layer.id}
      text={layer.text}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      fontFamily={fontFamily}
      fontSize={layer.fontSize}
      fill={layer.color}
      align={layer.align}
      stroke={layer.strokeColor}
      strokeWidth={layer.strokeColor ? layer.strokeWidth : 0}
      fillAfterStrokeEnabled
      shadowEnabled={layer.shadow}
      shadowColor="#000000"
      shadowBlur={8}
      shadowOpacity={0.6}
      draggable
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        // Scaling text becomes a font size, so exports stay crisp.
        const scale = Math.max(node.scaleX(), node.scaleY());
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          fontSize: Math.min(200, Math.max(6, Math.round(layer.fontSize * scale))),
        });
      }}
    />
  );
}

interface StatsNodeProps {
  layer: ZaoStatsLayer;
  fontFamily: string;
  color: string;
  onSelect: () => void;
  onChange: (patch: LayerPatch) => void;
}

function StatsNode({ layer, fontFamily, color, onSelect, onChange }: StatsNodeProps) {
  const lines = [
    layer.festival && `Festival: ${layer.festival}`,
    layer.year !== undefined && `Year: ${layer.year}`,
    layer.genre && `Genre: ${layer.genre}`,
    layer.city && `City: ${layer.city}`,
    layer.moment && `ZAO moment: ${layer.moment}`,
  ].filter((line): line is string => Boolean(line));
  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      draggable
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
    >
      <Rect
        width={520}
        height={Math.max(1, lines.length) * 34 + 24}
        fill="#000000"
        opacity={0.35}
        cornerRadius={12}
      />
      <Text
        x={16}
        y={12}
        width={488}
        text={lines.length ? lines.join('\n') : 'ZAO stats'}
        fontFamily={fontFamily}
        fontSize={24}
        lineHeight={1.4}
        fill={color}
      />
    </Group>
  );
}

export function CardCanvas({
  draft,
  displayWidth,
  fontFamilies,
  textColor,
  selectedId,
  onSelect,
  onLayerChange,
  stageRef,
}: CardCanvasProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const scale = displayWidth / CARD.width;
  const defaultFamily = fontFamilies.inter ?? 'sans-serif';
  const inset = draft.borderWidth / 2;

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const node = selectedId ? stage.findOne(`#${selectedId}`) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, stageRef]);

  const credits = validateCredits(draft.credits);
  const credit = credits.ok ? creditLine(credits.credits) : 'Artist: (add the artist credit)';

  return (
    <Stage
      ref={stageRef}
      width={displayWidth}
      height={CARD.height * scale}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage() || e.target.name() === 'card-background')
          onSelect(null);
      }}
      onTap={(e) => {
        if (e.target === e.target.getStage() || e.target.name() === 'card-background')
          onSelect(null);
      }}
    >
      <Layer>
        <Rect
          name="card-background"
          x={inset}
          y={inset}
          width={CARD.width - draft.borderWidth}
          height={CARD.height - draft.borderWidth}
          fill={draft.background}
          stroke={draft.borderColor}
          strokeWidth={draft.borderWidth}
          cornerRadius={draft.cornerRadius}
        />
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.roundRect(
              draft.borderWidth,
              draft.borderWidth,
              CARD.width - draft.borderWidth * 2,
              CARD.height - draft.borderWidth * 2,
              Math.max(0, draft.cornerRadius - draft.borderWidth),
            );
            ctx.closePath();
          }}
        >
          {draft.layers
            .filter((layer) => layer.visible)
            .map((layer) => {
              const select = () => onSelect(layer.id);
              const change = (patch: LayerPatch) => onLayerChange(layer.id, patch);
              if (layer.type === 'image') {
                return (
                  <ImageNode key={layer.id} layer={layer} onSelect={select} onChange={change} />
                );
              }
              if (layer.type === 'text') {
                return (
                  <TextNode
                    key={layer.id}
                    layer={layer}
                    fontFamily={fontFamilies[layer.fontId] ?? defaultFamily}
                    onSelect={select}
                    onChange={change}
                  />
                );
              }
              return (
                <StatsNode
                  key={layer.id}
                  layer={layer}
                  fontFamily={defaultFamily}
                  color={textColor}
                  onSelect={select}
                  onChange={change}
                />
              );
            })}
          <Text
            x={48}
            y={44}
            width={CARD.width - 96}
            text={draft.name || 'Card name'}
            fontFamily={defaultFamily}
            fontStyle="bold"
            fontSize={56}
            fill={textColor}
            opacity={draft.name ? 1 : 0.4}
            listening={false}
          />
          {draft.titleLine ? (
            <Text
              x={48}
              y={112}
              width={CARD.width - 96}
              text={draft.titleLine}
              fontFamily={defaultFamily}
              fontSize={28}
              fill={textColor}
              listening={false}
            />
          ) : null}
          {draft.rarityLabel ? (
            <Text
              x={48}
              y={44}
              width={CARD.width - 96}
              align="right"
              text={draft.rarityLabel}
              fontFamily={defaultFamily}
              fontStyle="bold"
              fontSize={22}
              fill={draft.borderColor}
              listening={false}
            />
          ) : null}
          {draft.bio ? (
            <Text
              x={48}
              y={CARD.height - 190}
              width={CARD.width - 96}
              text={draft.bio}
              fontFamily={defaultFamily}
              fontSize={24}
              lineHeight={1.3}
              fill={textColor}
              listening={false}
            />
          ) : null}
          {/* Mandatory credit line (doc 2690, rule 3). Always drawn, never hideable. */}
          <Text
            x={48}
            y={CARD.height - 80}
            width={CARD.width - 96}
            text={credit}
            fontFamily={defaultFamily}
            fontSize={18}
            fill={textColor}
            listening={false}
          />
        </Group>
        <Transformer
          ref={transformerRef}
          rotateEnabled
          keepRatio
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
          }
        />
      </Layer>
    </Stage>
  );
}
