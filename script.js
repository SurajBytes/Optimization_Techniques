// Function to handle file upload
document.getElementById('fileInput').addEventListener('change', handleFile);
var gMatrix = [];
var gWeights = [];
var gBenCols = [];
var gObjectList = [];
function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
      const data1 = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data1, {type: 'array'});
      
      // Assuming both tables are in the first sheet
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert Excel sheet to JSON
      const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
      //console.log(data);
      // Separate data into fluid properties and weights
      
      var BNB = [];
      var isSecondMatrixStarted = false;
      if(data!=null){
        data.forEach(row => {
          var isNumExist = false;
          for(let i=0;i<row.length;i++){
            if(!isNaN(row[i])){
              isNumExist = true;
              break;
            }
          }
          if(!isSecondMatrixStarted && row.length == 0 && gMatrix.length>0){//gmatrix is full and after that row is empty
            isSecondMatrixStarted = true;
          }
          if(isNumExist){
            var matrow =[];
            var nameRow = [];
            row.forEach(cell =>{
              if(!isNaN(cell)){
                matrow.push(cell);
              }
              else{
                if(!isSecondMatrixStarted){
                  nameRow.push(cell);
                }
              }
            })
            if(isSecondMatrixStarted){
              gWeights = matrow;
            }
            else{
              gMatrix.push(matrow);
              gObjectList.push(nameRow.join('-'));
            }
          }
          else{
            row.forEach(cell =>{
              if(cell.includes('Beneficial')){
                BNB.push(cell);
                if(cell == 'Beneficial'){
                  gBenCols.push(BNB.length-1);
                }
              }
            })
          }  
          
        });
      }
      //console.log('Fluid Properties Matrix:', gMatrix);
      //console.log('Weights Matrix:', gWeights);
      //console.log('Beneficial Indices:', gBenCols);
  };

  reader.readAsArrayBuffer(file);
}

// Function to determine file type based on file extension
function getFileType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  if (extension === 'csv') {
    return 'csv';
  } else if (extension === 'xlsx' || extension === 'xls') {
    return 'xlsx';
  } else {
    return 'unsupported';
  }
}

// Check if optimization technique is selected
function isTechniqueSelected() {
  const methodSelect = document.getElementById('methodSelect');
  return methodSelect.value !== 'none';
}

// Check if file is selected
function isFileSelected() {
  const fileInput = document.getElementById('fileInput');
  return fileInput.files.length > 0;
}

document.getElementById('calculateButton').addEventListener('click', function() {
  if (!isFileSelected()) {
    alert('Please select a file.');
    return;
  }

  if (!isTechniqueSelected()) {
    alert('Please select an optimization technique.');
    return;
  }

  const methodSelect = document.getElementById('methodSelect');
  var method = methodSelect.value;
  switch(method){
    case 'WASPAS':
      waspas();
      break;
    case 'MADM_TOPSIS':
      topsis();
      break; 
    case 'WSM':
      wsm();
      break;
    case 'GRA':
      gra();
      break;
    case 'MOORA':
      moora();
      break;  
    case 'ARAS':
      aras();
      break;
    case 'COPRAS':
      copras();
      break; 
    case 'MAUT':
      MAUT();
      break;
    case 'EDAS':
      edas();
      break;
    case 'CODAS':
      codas();
      break;   
  }

});

function waspas(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var normMat = [];
  var normWeightMat = [];
  var normProductMat = [];
  var WSM = [];
  var WPM = [];
  var WSPM = [];
  for(let r=0;r<matrix.length;r++){
      normMat.push([]);
      normWeightMat.push([]);
      normProductMat.push([]);
      for(let c=0;c<matrix[0].length;c++){
          var MaxMin = GetColMaxMin(c);
          var nums = MaxMin.split('+');
          if(benCols.includes(c)){
              normMat[r][c] = matrix[r][c]/nums[0];//**value/max(cols)
          }
          else{
              normMat[r][c] = nums[1]/matrix[r][c]; //**min(cols)/value
          }
          normWeightMat[r][c] = normMat[r][c] * weightMat[c];
          normProductMat[r][c] = Math.pow(normMat[r][c], weightMat[c]);
      }
    var sumR = normWeightMat[r].reduce((a, c) => a + c, 0);
    var prodR = normProductMat[r].reduce((a,c) => a*c, 1);
    WSM.push(sumR);
    WPM.push(prodR);
    WSPM.push(0.5*sumR + 0.5*prodR);
  }
  //console.log(WSM,WPM,WSPM);
  ShowOutput(WSPM);
  function GetColMaxMin(c){
      let max = matrix[0][c];
      let min = matrix[0][c];
      for(let r=0;r<matrix.length;r++){
          var cell = matrix[r][c];
          if(cell>max){
              max = cell;
          }
          if(cell<min){
              min = cell;
          }
      }
      return max+'+'+min;
  }
}

function topsis(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var normDecMat = [];//rect matrix
  var normWeightMat = [];//rect matrix
  var idealBest = [];//row matrix  //min for non beneficial and max for beneficial
  var idealWorst = [];//row matrix  //opp
  var Smax = [];//col matrix
  var Smin = [];//col matrix
  var Perfor = [];
  for(let r=0;r<matrix.length;r++){
      normDecMat.push([]);
      normWeightMat.push([]);
      for(let c=0;c<matrix[0].length;c++){
          var d = GetDenominator(c)
          normDecMat[r][c] = matrix[r][c]/d;
          normWeightMat[r][c] = normDecMat[r][c] * weightMat[c];
      }
  }
  
  for(let c=0;c<normWeightMat[0].length;c++){
        var MaxMin = GetColMaxMin(c);
        var nums = MaxMin.split('+');
        if(benCols.includes(c)){
            idealBest.push(nums[0]);
            idealWorst.push(nums[1]);
        }
        else{
            idealBest.push(nums[1]);
            idealWorst.push(nums[0]);
        }
        
  }
  
  for(let r=0;r<matrix.length;r++){
      var Rowmax = 0;
      var Rowmin = 0;
      for(let c=0;c<matrix[0].length;c++){
          Rowmax = Rowmax + Math.pow(normWeightMat[r][c] - idealBest[c],2);
          Rowmin = Rowmin + Math.pow(normWeightMat[r][c] - idealWorst[c],2);
      }
      Smax.push(Math.sqrt(Rowmax));
      Smin.push(Math.sqrt(Rowmin));
      var p = Math.sqrt(Rowmin)/(Math.sqrt(Rowmax)+Math.sqrt(Rowmin));
      Perfor.push(p)
  }
  //console.log(Perfor);
  ShowOutput(Perfor);
  function GetDenominator(c){
      var den = 0;
      for(let r=0;r<matrix.length;r++){
          den = den + matrix[r][c] * matrix[r][c];
      }
      den = Math.sqrt(den);
      return den;
  }
  
  function GetColMaxMin(c){
      let max = normWeightMat[0][c];
      let min = normWeightMat[0][c];
      for(let r=0;r<normWeightMat.length;r++){
          var cell = normWeightMat[r][c];
          if(cell>max){
              max = cell;
          }
          if(cell<min){
              min = cell;
          }
      }
      return max+'+'+min;
  }
  
}

function wsm(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var normMat = [];
  var normWeightMat = [];
  var WSM = [];
  
  for(let r=0;r<matrix.length;r++){
      normMat.push([]);
      normWeightMat.push([]);
      for(let c=0;c<matrix[0].length;c++){
          var MaxMin = GetColMaxMin(c);
          var nums = MaxMin.split('+');
          if(benCols.includes(c)){
              normMat[r][c] = matrix[r][c]/nums[0];//**value/max(cols)
          }
          else{
              normMat[r][c] = nums[1]/matrix[r][c]; //**min(cols)/value
          }
          normWeightMat[r][c] = normMat[r][c] * weightMat[c];
      }
    var sumR = normWeightMat[r].reduce((a, c) => a + c, 0);
    WSM.push(sumR);
    
  }
  //console.log(WSM,WPM,WSPM);
  ShowOutput(WSM);
  function GetColMaxMin(c){
      let max = matrix[0][c];
      let min = matrix[0][c];
      for(let r=0;r<matrix.length;r++){
          var cell = matrix[r][c];
          if(cell>max){
              max = cell;
          }
          if(cell<min){
              min = cell;
          }
      }
      return max+'+'+min;
  }
}

function gra(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var maxColMat = [];
  var minColMat = [];
  var benNonbenMat = [];
  var maxdevSeq = [];
  var mindevSeq = [];
  var devSeq = [];
  var GRCMat = [];//GreyRelationCoefficient
  var norWeightMat = [];
  var DC = 0.5;
  var finalMat = [];//col matrix
  for(let c=0;c<matrix[0].length;c++){
      var maxMin = GetColMaxMin(c,matrix);
      var m = maxMin.split('+');
      maxColMat.push(m[0]);
      minColMat.push(m[1]);
  }
  
  for(let r=0;r<matrix.length;r++){
      benNonbenMat.push([]);
      devSeq.push([]);
      for(let c=0;c<matrix[0].length;c++){
          if(benCols.includes(c)){
              benNonbenMat[r][c] = 
              (matrix[r][c]-minColMat[c])/
              (maxColMat[c]-minColMat[c]);
          }
          else{
              benNonbenMat[r][c] = 
              (maxColMat[c]- matrix[r][c])/
              (maxColMat[c]-minColMat[c]);
          }
          devSeq[r][c] = 1 - benNonbenMat[r][c];
      }
  }
  
  for(let c=0;c<devSeq[0].length;c++){
      var maxMin = GetColMaxMin(c,devSeq);
      var m = maxMin.split('+'); 
      maxdevSeq.push(m[0]);
      mindevSeq.push(m[1]);
  }
  
  for(let r=0;r<matrix.length;r++){
      GRCMat.push([]);
      norWeightMat.push([]);
      for(let c=0;c<matrix[0].length;c++){
          GRCMat[r][c]= 
          (mindevSeq[c] + DC * maxdevSeq[c])/
          (devSeq[r][c] + DC * maxdevSeq[c]);
          
          norWeightMat[r][c] = GRCMat[r][c]* weightMat[c];//not calculated in table
      }
  }
  
  for(let r=0;r<norWeightMat.length;r++){
      var rowSum = norWeightMat[r].reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      finalMat.push(rowSum/norWeightMat.length);
  }
  console.log(GRCMat);
  ShowOutput(finalMat);
  function GetColMaxMin(c,mat){
      let max = mat[0][c];
      let min = mat[0][c];
      for(let r=0;r<mat.length;r++){
          var cell = mat[r][c];
          if(cell>max){
              max = cell;
          }
          if(cell<min){
              min = cell;
          }
      }
      return max+'+'+min;
  }
  
}

function moora(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var normDecMat = [];//rect matrix
  var normWeightMat = [];//rect matrix
  var BenefitSumMatrix = [];//col matrix
  var NonBenefitSumMatrix = [];//col matrix
  var Y = [];//col matrix
  for(let r=0;r<matrix.length;r++){
      normDecMat.push([]);
      normWeightMat.push([]);
      var BenefitSum = 0;
      var NonBenefitSum = 0;
      for(let c=0;c<matrix[0].length;c++){
          var d = GetDenominator(c)
          normDecMat[r][c] = matrix[r][c]/d;
          normWeightMat[r][c] = normDecMat[r][c] * weightMat[c];
          if(benCols.includes(c)){
              BenefitSum = BenefitSum + normWeightMat[r][c];
          }
          else{
              NonBenefitSum = NonBenefitSum + normWeightMat[r][c];
          }
      }
      BenefitSumMatrix.push(BenefitSum);
      NonBenefitSumMatrix.push(NonBenefitSum);
  }
  
  for(let i=0;i<BenefitSumMatrix.length;i++){
      var s = BenefitSumMatrix[i] - NonBenefitSumMatrix[i];
      Y.push(s);
  }
  //console.log(Y);// rank on basis of this
  ShowOutput(Y);
  function GetDenominator(c){
      var den = 0;
      for(let r=0;r<matrix.length;r++){
          den = den + matrix[r][c] * matrix[r][c];
      }
      den = Math.sqrt(den);
      return den;
  }
}

function aras(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var normDecMat = [];//rect matrix
  var normWeightMat = [];//rect matrix
  var OV=[];
  var BenefitSumMatrix = [];//col matrix
  var NonBenefitSumMatrix = [];//col matrix
  var SumOfSum = [];//col matrix
  var K = [];//col matrix
  for(let r=0;r<matrix.length;r++){
      normDecMat.push([]);
      normWeightMat.push([]);
      var BenefitSum = 0;
      var NonBenefitSum = 0;
      for(let c=0;c<matrix[0].length;c++){
          var d = GetDenominator(c)
          normDecMat[r][c] = matrix[r][c]/d;
          normWeightMat[r][c] = normDecMat[r][c] * weightMat[c];
          if(benCols.includes(c)){
              BenefitSum = BenefitSum + normWeightMat[r][c];
          }
          else{
              NonBenefitSum = NonBenefitSum + normWeightMat[r][c];
          }
      }
      SumOfSum.push(BenefitSum + NonBenefitSum);
      BenefitSumMatrix.push(BenefitSum);
      NonBenefitSumMatrix.push(NonBenefitSum);
  }
  
  var maxSumOfSum = GetMax(SumOfSum);
  K = SumOfSum.map(x => x/maxSumOfSum);
  //console.log(K)
  ShowOutput(K);
  function GetMax(arr){
      var max = arr[0];
      arr.forEach(ele =>{
          if(ele>max){
              max = ele;
          }
      })
      return max;
  }
  
  // function GetMinCol(arr,c){
  //     let min = arr[0][c];
  //     for(let r=0;r<arr.length;r++){
  //         if(arr[r][c]<min){
  //             min = arr[r][c];
  //         }
  //     }
  //     return min;
  // }
  
  // function GetMaxCol(arr,c){
  //     let max = arr[0][c];
  //     for(let r=0;r<arr.length;r++){
  //         if(arr[r][c] > max){
  //             max = arr[r][c];
  //         }
  //     }
  //     return max;
  // }
  function GetDenominator(c){
      var den = 0;
      for(let r=0;r < matrix.length;r++){
          den = den + matrix[r][c];
      }
      return den;
  }
  
}

function copras(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var normDecMat = [];//rect matrix
  var normWeightMat = [];//rect matrix
  var BenefitSumMatrix = [];//col matrix
  var NonBenefitSumMatrix = [];//col matrix
  var SminByS = [];//col matrix
  var Q = [];//col matrix
  var U =[]; // col matrix
  for(let r=0;r<matrix.length;r++){
      normDecMat.push([]);
      normWeightMat.push([]);
      var BenefitSum = 0;
      var NonBenefitSum = 0;
      for(let c=0;c<matrix[0].length;c++){
          var d = GetDenominator(c)
          normDecMat[r][c] = matrix[r][c]/d;
          normWeightMat[r][c] = normDecMat[r][c] * weightMat[c];
          if(benCols.includes(c)){
              BenefitSum = BenefitSum + normWeightMat[r][c];
          }
          else{
              NonBenefitSum = NonBenefitSum + normWeightMat[r][c];
          }
      }
      BenefitSumMatrix.push(BenefitSum);
      NonBenefitSumMatrix.push(NonBenefitSum);
  }
  var MinNonBenefitSumMatrix = GetMin();
  SminByS = NonBenefitSumMatrix.map(x =>  MinNonBenefitSumMatrix/x );
  
  for(let r=0;r< BenefitSumMatrix.length;r++){
      var q = BenefitSumMatrix[r] + 
      (MinNonBenefitSumMatrix*sum(NonBenefitSumMatrix))/(NonBenefitSumMatrix[r]*sum(SminByS));
      Q.push(q);
  }
  
  var max = GetMax(Q);
  U = Q.map(x =>  (x/max)*100);
  //console.log(U);// rank on basis of this
  ShowOutput(U);
  function GetMax(arr){
      var max = arr[0];
      arr.forEach(ele =>{
          if(ele>max){
              max = ele;
          }
      })
      return max;
  }
  
  function sum(arr){
      return arr.reduce(getSum,0);
  }
  
  function getSum(total, num) {
    return total + num;
  }
  
  function GetDenominator(c){
      var den = 0;
      for(let r=0;r < matrix.length;r++){
          den = den + matrix[r][c];
      }
      return den;
  }
  
  function GetMin(){
      var min = NonBenefitSumMatrix[0];
      NonBenefitSumMatrix.forEach(ele =>{
          if(min < ele){
              min = ele;
          }
      });
      return min;
  }
  
}

function MAUT(){
//maut
var matrix = gMatrix;
var weightMat = gWeights;
var benCols = gBenCols;//index of cols
var maxMat = [];
var minMat = [];
var normMat = [];
var expMat = [];
var weightedMat = [];
var sumWeightMat = [];
const e = 2.718;
for(let c=0;c<matrix[0].length;c++){
  var maxMin = GetColMaxMin(matrix,c);
  var num = maxMin.split('+');
  maxMat.push(num[0]);
  minMat.push(num[1]);
}
for(let r=0;r<matrix.length;r++){
  normMat.push([]);
  expMat.push([]);
  weightedMat.push([]);
  var sum = 0;
  for(let c=0;c<matrix[0].length;c++){
    if(benCols.includes(c)){
      normMat[r][c] = (matrix[r][c] - minMat[c])/
                      (maxMat[c] - minMat[c])
    }
    else{
      normMat[r][c] = 1 + (minMat[c] - matrix[r][c])/
                          (maxMat[c] - minMat[c])
    }
    expMat[r][c] =  (e ** ((normMat[r][c])*(normMat[r][c]))-1)/1.71;
    weightedMat[r][c] = expMat[r][c]* weightMat[c];
    sum = sum + weightedMat[r][c];
  }
  sumWeightMat.push(sum);
}
//console.log(expMat);

ShowOutput(sumWeightMat);
function GetColMaxMin(mat,c){
  let max = mat[0][c];
  let min = mat[0][c];
  for(let r=0;r<mat.length;r++){
      var cell = mat[r][c];
      if(cell>max){
          max = cell;
      }
      if(cell<min){
          min = cell;
      }
  }
  return max+'+'+min;
}
}

function edas(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var avgMat = [];
  var PDA=[];
  var NDA=[];
  var weightedPDA = [];
  var weightedNDA = [];
  var sumWeightPDA = [];
  var sumWeightNDA = [];
  var NSP = [];//col mat
  var NSN = [];//col mat
  var finalMat = [];//col mat
  for(let c=0;c<matrix[0].length;c++){
      var rowSum = GetColSum(c,matrix);
      avgMat.push(rowSum/matrix.length);
  }
  
  for(let r=0;r<matrix.length;r++){
     PDA.push([]);
     NDA.push([]);
     weightedPDA.push([]);
     weightedNDA.push([]);
     var sumPDA = 0;
     var sumNDA = 0;
      for(let c=0;c<matrix[0].length;c++){
          if(benCols.includes(c)){
              PDA[r][c] = Math.max(0,matrix[r][c]-avgMat[c])/avgMat[c];
              NDA[r][c] = Math.max(0,avgMat[c]-matrix[r][c])/avgMat[c];
          }
          else{
              PDA[r][c] = Math.max(0,avgMat[c]-matrix[r][c])/avgMat[c];
              NDA[r][c] = Math.max(0,matrix[r][c]-avgMat[c])/avgMat[c];
          }
          weightedPDA[r][c] = PDA[r][c] * weightMat[c];
          weightedNDA[r][c] = NDA[r][c] * weightMat[c];
          sumPDA = sumPDA + weightedPDA[r][c];
          sumNDA = sumNDA + weightedNDA[r][c];
      }
      sumWeightPDA.push(sumPDA);
      sumWeightNDA.push(sumNDA);
  }
  
  for(let r=0;r<sumWeightPDA.length;r++){
      var max1 = Math.max(...sumWeightPDA);
      var nsp = sumWeightPDA[r]/max1;
      var max2 = Math.max(...sumWeightNDA);
      var nsn = 1 - sumWeightNDA[r]/max2;
      NSP.push(nsp);
      NSN.push(nsn);
      finalMat.push((NSP[r]+NSN[r])/2);
  }
  //console.log(finalMat)
  ShowOutput(finalMat);
  function GetColSum(c,matrix){
      var sum = 0;
      for(let r=0;r<matrix.length;r++){
          sum = sum + matrix[r][c];
      }
      return sum;
  }
}

function codas(){
  var matrix = gMatrix;
  var weightMat = gWeights;
  var benCols = gBenCols;//index of cols
  var normDecMat = [];//rect matrix
  var normWeightMat = [];//rect matrix
  var negIdSol = [];//row matrix
  var euclMat = [];//col matrix
  var taxMat = [];//col matrix
  var RAM = [];
  var K = 0.02;
  var H = [];
  for(let r=0;r<matrix.length;r++){
      normDecMat.push([]);
      normWeightMat.push([]);
      RAM.push([]);
      for(let c=0;c<matrix[0].length;c++){
          var MaxMin = GetColMaxMin(matrix,c);
          var nums = MaxMin.split('+');
          if(benCols.includes(c)){
             normDecMat[r][c] = matrix[r][c]/nums[0];
          }
          else{
            normDecMat[r][c] = nums[1]/matrix[r][c];
          }
          normWeightMat[r][c] = normDecMat[r][c] * weightMat[c];
      }
  }
  
  for(let c=0;c<normWeightMat[0].length;c++){
        var MaxMin = GetColMaxMin(normWeightMat,c);
        var nums = MaxMin.split('+');
        negIdSol.push(nums[1]);
  }
  
  for(let r=0;r<normWeightMat.length;r++){
     var sumE = 0;
     var sumT=0;
      for(let c=0;c<normWeightMat[0].length;c++){
          sumE = sumE + Math.pow((normWeightMat[r][c]-negIdSol[c]),2);
          sumT = sumT + Math.abs(normWeightMat[r][c]-negIdSol[c])
      }
      euclMat.push(Math.sqrt(sumE));
      taxMat.push(sumT);
  }
  //console.log(euclMat,taxMat);
  for(let c=0;c<euclMat.length;c++){
      for(let r=0;r<euclMat.length;r++){
          RAM[r][c] = euclMat[r]-euclMat[c] + K*(euclMat[r]-euclMat[c])
          *(taxMat[r]-taxMat[c]);
          //var str = RAM[r][c]+ '='+ euclMat[r]+'-'+euclMat[c]+ '+'+ K+'*('+euclMat[r]+'-'+euclMat[c]+')*('+taxMat[r]+'-'+taxMat[c]+')'
          //console.log(str);
      }
      //console.log('-------------------new col-----------------------')
  }
  
  for(let r=0;r<RAM.length;r++){
      var sum = RAM[r].reduce((accumulator, currentValue) => accumulator + currentValue, 0);
     H.push(sum);
  }
  //console.log(RAM)
  ShowOutput(H);
  function GetColMaxMin(mat,c){
      let max = mat[0][c];
      let min = mat[0][c];
      for(let r=0;r<mat.length;r++){
          var cell = mat[r][c];
          if(cell>max){
              max = cell;
          }
          if(cell<min){
              min = cell;
          }
      }
      return max+'+'+min;
  }
}

function ShowOutput(finalArr){
  var rank = rankings(finalArr);
  var str = ``;
  for(let i=0;i<finalArr.length;i++){
     str += `<tr>
                <th scope="row">`+(i+1) +`</th>
                <td>`+ gObjectList[i] +`</td>
                <td>`+ finalArr[i] +`</td>
                <td>`+ rank[i] +`</td>
              </tr>`;
     
  }
  document.getElementById("outputBody").innerHTML = str;
}

function rankings(array) {
  return array
    .map((v, i) => [v, i])
    .sort((a, b) => b[0] - a[0])
    .map((a, i) => [...a, i + 1])
    .sort((a, b) => a[1] - b[1])
    .map(a => a[2]);
}