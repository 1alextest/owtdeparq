const { Client } = require('pg');
require('dotenv').config();

async function checkBlueEnergyProject() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check BlueEnergy project structure
    const projectInfo = await client.query(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        pr.id as presentation_id,
        pr.name as presentation_name,
        pd.id as deck_id,
        pd.title as deck_title,
        pd.created_at as deck_created
      FROM projects p
      LEFT JOIN presentations pr ON p.id = pr.project_id
      LEFT JOIN pitch_decks pd ON pr.id = pd.presentation_id
      WHERE p.name LIKE '%BlueEnergy%'
      ORDER BY pd.created_at;
    `);

    console.log('BlueEnergy Project Structure:');
    console.log('=====================================');
    
    if (projectInfo.rows.length === 0) {
      console.log('No BlueEnergy project found');
      return;
    }

    const project = projectInfo.rows[0];
    console.log(`Project: ${project.project_name} (${project.project_id})`);
    console.log('');

    // Group by presentation
    const presentationMap = new Map();
    projectInfo.rows.forEach(row => {
      if (!presentationMap.has(row.presentation_id)) {
        presentationMap.set(row.presentation_id, {
          id: row.presentation_id,
          name: row.presentation_name,
          decks: []
        });
      }
      if (row.deck_id) {
        presentationMap.get(row.presentation_id).decks.push({
          id: row.deck_id,
          title: row.deck_title,
          created: row.deck_created
        });
      }
    });

    presentationMap.forEach((presentation, id) => {
      console.log(`Presentation: ${presentation.name} (${id})`);
      console.log(`  Decks (${presentation.decks.length}):`);
      presentation.decks.forEach(deck => {
        console.log(`    - ${deck.title} (${deck.id})`);
        console.log(`      Created: ${deck.created}`);
      });
      console.log('');
    });

    // Check if decks have different themes/purposes that warrant separate presentations
    console.log('Deck Analysis:');
    console.log('==============');
    projectInfo.rows.forEach(row => {
      if (row.deck_id) {
        console.log(`Deck: ${row.deck_title}`);
        console.log(`  Created: ${row.deck_created}`);
        console.log('');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkBlueEnergyProject();
