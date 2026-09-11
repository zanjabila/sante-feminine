let articleSelection = null;
const articleEditor = document.getElementById('ficheEditor');
document.addEventListener('selectionchange', () => {
  const s = getSelection();
  if (s.rangeCount && articleEditor.contains(s.anchorNode) && articleEditor.contains(s.focusNode))
    articleSelection = s.getRangeAt(0).cloneRange();
});
document.querySelector('.rich-toolbar').addEventListener('mousedown', e => {
  if (e.target.closest('button')) e.preventDefault();
});
function restoreArticleSelection() {
  articleEditor.focus();
  if (articleSelection && articleEditor.contains(articleSelection.commonAncestorContainer)) {
    const s=getSelection();s.removeAllRanges();s.addRange(articleSelection);
  }
}
articleEditor.addEventListener('paste', e => {
  e.preventDefault();restoreArticleSelection();
  const html=e.clipboardData.getData('text/html');
  const text=e.clipboardData.getData('text/plain');
  document.execCommand('insertHTML',false,SFArticle.render(html || text));
  syncRichEditor();updatePreview();
});
function chooseArticleImage(){document.getElementById('articleImageFile').click()}
async function uploadArticleImage(input) {
  const file=input.files[0];input.value='';if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
    showToast('Image JPG, PNG ou WebP uniquement, maximum 5 Mo.');return;
  }
  const alt=prompt('Décrivez cette illustration pour les personnes qui ne peuvent pas la voir :');
  if(!alt?.trim())return;
  const savedRange=articleSelection?.cloneRange();
  const editingArticle=document.getElementById('editingId').value;
  try {
    showToast('Préparation de l’image…');
    const bitmap=await createImageBitmap(file);
    if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('Image trop grande : maximum 40 mégapixels.')}
    const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));
    if(!blob||blob.size>5*1024*1024)throw new Error('Impossible de compresser cette image.');
    const token=SFSession.token();if(!token)throw new Error('Reconnectez-vous à l’administration.');
    const path=crypto.randomUUID()+'.webp';
    const res=await fetch(SUPABASE_URL+'/storage/v1/object/article-images/'+path,{
      method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'image/webp'},body:blob});
    if(!res.ok)throw new Error('Import refusé : vérifiez le stockage article-images et ses droits administrateur dans Supabase.');
    if(document.getElementById('editingId').value!==editingArticle)
      throw new Error('La fiche a changé pendant l’import. Réouvrez la fiche initiale avant de réessayer.');
    articleSelection=savedRange;restoreArticleSelection();
    const img=document.createElement('img');
    img.src=SUPABASE_URL+'/storage/v1/object/public/article-images/'+path;img.alt=alt.trim();
    document.execCommand('insertHTML',false,img.outerHTML);
    syncRichEditor();updatePreview();showToast('Image insérée. Enregistrez la fiche pour la publier.');
  } catch(error){showToast(error.message)}
}
