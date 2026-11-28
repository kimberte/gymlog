// Execute the real TypeScript writer, parser and personal importer without a browser.
const fs=require("node:fs"),assert=require("node:assert/strict"),ts=require("typescript");
require.extensions[".ts"]=(mod,filename)=>mod._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {ORIGINAL_PROGRAM_BLOCKS}=require("../app/workout-programs/originalProgramBlocks.ts");
const {PROGRAMS}=require("../app/lib/programs.ts");
const {EXERCISES}=require("../app/lib/exercises.ts");
const {readPrescription,writePrescription,validatePrescriptionLines,prescriptionDraft}=require("../app/lib/structuredCoaching.ts");
const {structuredProgramImport}=require("../app/lib/structuredProgramImport.ts");
const {parseStructuredFromNotes}=require("../app/lib/structuredNotes.ts");
const catalog=new Map(PROGRAMS.map(p=>[p.slug,p]));
assert.equal(catalog.size,PROGRAMS.length,"Duplicate catalog slug");
let sessions=0,sets=0;
for(const [slug,block] of Object.entries(ORIGINAL_PROGRAM_BLOCKS)){
 const program=catalog.get(slug);assert.ok(program,slug+" missing from catalog");
 assert.equal(block.workouts.length,program.days*4,slug+" session count");
 const offsets=block.workouts.map(w=>w.offsetDays);
 assert.equal(new Set(offsets).size,offsets.length,slug+" duplicate date");
 assert.ok(offsets.every((d,i)=>Number.isInteger(d)&&d>=0&&d<28&&(!i||d>offsets[i-1])),slug+" offsets");
 for(const w of block.workouts){
  const label=slug+" "+w.day;assert.ok(validatePrescriptionLines(w.exercises),label+" invalid prescriptions");
  let n=0;
  for(const line of w.exercises){const e=readPrescription(line);assert.ok(EXERCISES.includes(e.name),label+" unknown exercise "+e.name);assert.deepEqual(readPrescription(writePrescription(e)),e,label+" serialization");n+=Number(e.sets);}
  const trainer=prescriptionDraft(w.focus,w.exercises),personal=structuredProgramImport(w.focus,w.exercises,w.guidance);
  assert.equal(personal.review,0,label+" unexpected manual review");
  assert.equal(trainer.rows.length,n,label+" trainer set count");assert.equal(personal.structured.rows.length,n,label+" personal set count");
  for(let i=0;i<n;i++){const a=trainer.rows[i],b=personal.structured.rows[i];for(const key of ["name","targetReps","targetLoad","targetRest","targetRpe","targetRir","targetTempo","setType","blockRound"]){assert.deepEqual(a[key],b[key],label+" "+key);}assert.ok(!a.completed&&!b.completed&&!a.reps&&!b.reps&&!a.weight&&!b.weight,label+" fabricated actuals");}
  const restored=parseStructuredFromNotes(personal.notes);assert.ok(restored,label+" notes decode failed");assert.equal(restored.rows.length,n,label+" restored set count");
  sessions++;sets+=n;
 }
}
console.log("Validated "+Object.keys(ORIGINAL_PROGRAM_BLOCKS).length+" four-week blocks, "+sessions+" sessions, "+sets+" sets; "+catalog.size+" catalog entries.");
