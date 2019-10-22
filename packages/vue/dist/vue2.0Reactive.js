const arrayProto = Array.prototype
const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
methodsToPatch.forEach(method=>{
  arrayMethods[method] = function(){ 
    //函数劫持 把函数进行重写 
    // 而内部实际上继续调用原来的方法但在这里我们可以去调用更新视图的方法
     console.log('数组 更新啦...')
      arrayProto[method].call(this,...arguments)
  }
});


function observer(data){
  // 判断是否为对象 如果不是则直接返回，Object.defineProperty是对象上的属性
  if(typeof data !== 'object' || data == null){
    return data;
  }
  if(Array.isArray(data)){ // 如果是数组,则对数据进行遍历并对其value进行递归监听
    // 在这里对数组方法进行重写 即函数劫持
    Object.setPrototypeOf(data, arrayMethods); 
    for(let i = 0; i< data.length ;i++){
        observer(data[i]);
    }
  } else {
    for(let key in data){
      defineReactive(data,key,data[key]);
    }
  }
}
function defineReactive(data,key,value){
  observer(value); // 递归 继续对当前value进行拦截

  //Object.defineProperty直接在对象上定义新属性，或修改对象上的现有属性，然后返回对象。
  //不了解的请转MDN文档 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
  Object.defineProperty(data, key, {
      get(){
          console.log('获取了值') // 在此做依赖收集的操作
          return value 
      },
      set(newValue){
          if(newValue !== value){
              // 对于新增的值也需要监听
              observer(newValue)
              console.log('设置了值')
              value = newValue
          }
      }
  });
}

function reactiveSet (data,key,value) {
  data[key] = value
  observer(data)
}


let data = {name:'',attr:[1,2,3,4,5,100]};
observer(data)

// 给data里面的name赋值 = "Eno"
// data.name = 'Eno'
// console.log(data.name);  
//  data.age = 12
//  console.log(data.age); 
// reactiveSet(data,'gender','男')
// console.log(data.gender)
// console.log(data.attr)
data.attr.push(10000); 
data.attr.splice(0,1); 

