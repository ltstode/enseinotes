import * as XLSX from 'xlsx';

// Script pour générer un fichier Excel modèle
const generateExcelTemplate = () => {
  // Données d'exemple
  const data = [
    ['Nom', 'Prénom', 'ID'],
    ['DUPONT', 'Jean', 'STU-001'],
    ['MARTIN', 'Marie', 'STU-002'],
    ['BERNARD', 'Sophie', 'STU-003'],
    ['LEFEBVRE', 'Pierre', 'STU-004'],
    ['DUBOIS', 'Claire', 'STU-005'],
  ];

  // Créer une nouvelle feuille
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Créer un nouveau classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');

  // Générer le fichier
  XLSX.writeFile(workbook, 'modele_import_eleves.xlsx');
  
  console.log('✅ Fichier modèle créé : modele_import_eleves.xlsx');
};

generateExcelTemplate();
