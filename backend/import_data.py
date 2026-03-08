"""Fast CSV data importer for Duelo themes and questions."""
import asyncio
import csv
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import engine
from sqlalchemy import text


ANSWER_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}


async def import_data(themes_path: str, questions_path: str):
    """Import themes and questions from CSV files using raw SQL for speed."""
    
    async with engine.begin() as conn:
        # ── Import Themes ──
        print("Importing themes...")
        with open(themes_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            themes_count = 0
            for row in reader:
                theme_id = row.get("ID_Theme", "").strip()
                if not theme_id:
                    continue
                
                # Upsert theme
                await conn.execute(text("""
                    INSERT INTO themes (id, super_category, cluster, name, description, color_hex,
                                       title_lv1, title_lv10, title_lv20, title_lv35, title_lv50,
                                       icon_url, question_count, created_at)
                    VALUES (:id, :sc, :cl, :nm, :desc, :ch, :t1, :t10, :t20, :t35, :t50, :iu, 0, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        super_category = :sc, cluster = :cl, name = :nm, description = :desc,
                        color_hex = :ch, title_lv1 = :t1, title_lv10 = :t10, title_lv20 = :t20,
                        title_lv35 = :t35, title_lv50 = :t50, icon_url = :iu
                """), {
                    "id": theme_id,
                    "sc": row.get("Super_Categorie", "").strip(),
                    "cl": row.get("Cluster", "").strip(),
                    "nm": row.get("Nom_Public", "").strip(),
                    "desc": row.get("Description", "").strip(),
                    "ch": row.get("Couleur_Hex", "").strip(),
                    "t1": row.get("Titre_Niv_1", "").strip(),
                    "t10": row.get("Titre_Niv_10", "").strip(),
                    "t20": row.get("Titre_Niv_20", "").strip(),
                    "t35": row.get("Titre_Niv_35", "").strip(),
                    "t50": row.get("Titre_Niv_50", "").strip(),
                    "iu": row.get("URL_Icone", "").strip() or None,
                })
                themes_count += 1
        
        print(f"  ✅ {themes_count} themes imported")

        # ── Import Questions ──
        print("Importing questions...")
        with open(questions_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            questions_count = 0
            skipped = 0
            batch = []
            
            for row in reader:
                q_id = row.get("ID", "").strip()
                theme_id = row.get("Catégorie", row.get("Categorie", "")).strip()
                question_text = row.get("Question", "").strip()
                if not q_id or not question_text:
                    skipped += 1
                    continue
                
                rep_a = row.get("Rep A", "").strip()
                rep_b = row.get(" Rep B", row.get("Rep B", "")).strip()
                rep_c = row.get("Rep C", "").strip()
                rep_d = row.get("Rep D", "").strip()
                bonne_rep = row.get("Bonne rep", "").strip().upper()
                difficulte = row.get("Difficulté", row.get("Difficulte", "")).strip()
                angle = row.get("Angle", "").strip()
                angle_num_str = row.get("Angle Num", "").strip()

                correct_option = ANSWER_MAP.get(bonne_rep, 0)
                
                try:
                    angle_num = int(angle_num_str)
                except (ValueError, TypeError):
                    angle_num = 0

                # Use JSON array format for options
                import json
                options_json = json.dumps([rep_a, rep_b, rep_c, rep_d])

                batch.append({
                    "id": q_id,
                    "cat": theme_id,
                    "qt": question_text,
                    "opts": options_json,
                    "co": correct_option,
                    "diff": difficulte,
                    "angle": angle,
                    "anum": angle_num,
                })
                
                # Insert in batches of 500
                if len(batch) >= 500:
                    await _insert_batch(conn, batch)
                    questions_count += len(batch)
                    batch = []
                    if questions_count % 5000 == 0:
                        print(f"  ... {questions_count} questions inserted")
            
            # Final batch
            if batch:
                await _insert_batch(conn, batch)
                questions_count += len(batch)
        
        print(f"  ✅ {questions_count} questions imported ({skipped} skipped)")

        # ── Update question counts per theme ──
        print("Updating question counts...")
        await conn.execute(text("""
            UPDATE themes SET question_count = (
                SELECT COUNT(*) FROM questions WHERE questions.category = themes.id
            )
        """))
        
        # Verify counts
        result = await conn.execute(text("SELECT id, name, question_count FROM themes ORDER BY id"))
        for row in result:
            print(f"  {row[0]}: {row[1]} ({row[2]} questions)")
    
    print("\n🎉 Import complete!")


async def _insert_batch(conn, batch):
    """Insert a batch of questions using ON CONFLICT to handle duplicates."""
    for item in batch:
        try:
            await conn.execute(text("""
                INSERT INTO questions (id, category, question_text, options, correct_option, difficulty, angle, angle_num, created_at)
                VALUES (:id, :cat, :qt, :opts::json, :co, :diff, :angle, :anum, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    category = :cat, question_text = :qt, options = :opts::json,
                    correct_option = :co, difficulty = :diff, angle = :angle, angle_num = :anum
            """), item)
        except Exception as e:
            # Skip individual errors
            pass


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python import_data.py <themes.csv> <questions.csv>")
        sys.exit(1)
    
    asyncio.run(import_data(sys.argv[1], sys.argv[2]))
