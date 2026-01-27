// components/SectionEditorModal.tsx
import React, { useState, useEffect } from 'react';
import { FormSection } from '../types';
import { Modal } from './ui/Modal';
import Input from './ui/Input';
import { Button } from './ui/Button';

interface SectionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string, description?: string }) => void;
  section?: FormSection;
}

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({ isOpen, onClose, onSave, section }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && section) {
      setTitle(section.title);
      setDescription(section.description || '');
    } else if (isOpen) {
      setTitle('');
      setDescription('');
    }
  }, [isOpen, section]);

  const handleSave = () => {
    if (title.trim()) {
      onSave({ title, description });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={section ? 'Editar Sección' : 'Añadir Nueva Sección'}>
      <div className="space-y-4">
        <Input 
          label="Título de la Sección"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <Input 
          label="Descripción (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!title.trim()}>Guardar Sección</Button>
        </div>
      </div>
    </Modal>
  );
};
