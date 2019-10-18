let defalutName = ''
let data = {name:''};

function observer(data){
  // 判断是否为对象 如果不是则直接返回，Object.defineProperty是对象上的属性
  if(typeof data !== 'object' || data == null){
    return data;
  }
  for(let key in data){
    defineReactive(data,key,data[key]);
  }
}
function defineReactive(data,key,value){
  //Object.defineProperty直接在对象上定义新属性，或修改对象上的现有属性，然后返回对象。
  //不了解的请转MDN文档 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
  Object.defineProperty(data, key, {
      get(){
          return value 
      },
      set(newValue){
          if(newValue !== value){
              value = newValue
          }
      }
  });
}
// 
observer(data)
console.log('data.name==',data.name);
// expected output: ''

// 给data里面的name赋值 = "Eno"
data.name = 'Eno'
console.log(data.name);   // expected output: Eno

console.log(defalutName); // expected output: Eno