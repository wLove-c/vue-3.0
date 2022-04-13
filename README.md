# vue-next [![CircleCI](https://circleci.com/gh/vuejs/vue-next.svg?style=svg&circle-token=fb883a2d0a73df46e80b2e79fd430959d8f2b488)](https://circleci.com/gh/vuejs/vue-next)

## Status: Pre-Alpha.

We have achieved most of the architectural goals and new features planned for v3:

- Compiler
  - [x] Modular architecture
  - [x] "Block tree" optimization
  - [x] More aggressive static tree hoisting
  - [x] Source map support
  - [x] Built-in identifier prefixing (aka "stripWith")
  - [x] Built-in pretty-printing
  - [x] Lean ~10kb brotli-compressed browser build after dropping source map and identifier prefixing

- Runtime
  - [x] Significantly faster
  - [x] Simultaneous Composition API + Options API support, **with typings**
  - [x] Proxy-based change detection
  - [x] Fragments
  - [x] Portals
  - [x] Suspense w/ `async setup()`

However, there are still some 2.x parity features not completed yet:

- [ ] Server-side rendering
- [ ] `<keep-alive>`
- [ ] `<transition>`
- [ ] Compiler DOM-specific transforms
  - [ ] `v-on` DOM modifiers
  - [ ] `v-model`
  - [x] `v-text`
  - [x] `v-pre`
  - [x] `v-once`
  - [x] `v-html`
  - [ ] `v-show`

The current implementation also requires native ES2015+ in the runtime environment and does not support IE11 (yet).

## Contribution

See [Contributing Guide](https://github.com/vuejs/vue-next/blob/master/.github/contributing.md).


@[TOC](vue2.0/vue3.0响应式源码实践,麻麻，我再也不怕被面试官提问啦)

![杀生丸.jpg](https://upload-images.jianshu.io/upload_images/11447772-931648049eb89360.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

-----
### 写在前面
> 震惊！！！ 2019年10月5日，尤小右公开了 Vue 3.0 的源代码。源码地址：[vue-next](https://github.com/vuejs/vue-next)，此次更新的主要内容除了自行查看源码还可以在知乎上进行了解[尤小右 3.0  RFC](https://zhuanlan.zhihu.com/p/68477600)，在这两篇的基础上，接下来我将为大家展示最近学习到3.0的内容解读

了解3.0的进步，我们得先了解2.0的响应式原理，如果已经知道其优势劣势的大佬自行跳过~~
### vue2.0响应式源码实现
> 看过官方文档的同学都知道[Vue 响应式系统的解释](https://cn.vuejs.org/v2/guide/reactivity.html#%E5%A6%82%E4%BD%95%E8%BF%BD%E8%B8%AA%E5%8F%98%E5%8C%96): 当你把一个普通的 JavaScript 对象传入 Vue 实例作为 `data` 选项，Vue 将遍历此对象所有的属性，并使用 [`Object.defineProperty`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 把这些属性全部转为`getter/setter`。`Object.defineProperty` 是 ES5 中一个无法 shim 的特性，这也就是 Vue 不支持 IE8 以及更低版本浏览器的原因

下面我们将大概先实现vue2.0响应

> 原理:使用 Object.defineProperty 可以重新定义属性,并且给属性增加 getter 和setter；
#### 1. 先创建一个对象
```
// 我们先创建一个对象，然后通过某个方法去监听这个对象，当对象的值改变时，触发操作
let defalutName = ''
let data = {name:''}
// observer监听函数
observer(data)
console.log(data.name);
// expected output: Magic Eno

// 给data里面的name赋值 = "Eno"
data.name = 'Eno'
console.log(data.name);   // expected output: Eno

console.log(defalutName); // expected output: Eno

```
#### 2.实现observer方法
> observer的效果要求很简单，就是监听data对象，当data里面的属性值改变时，监听到其改变； 
下面实现一个简陋的双向数据绑定，即data的name改变时，defaultName也要改变，实现双向数据绑定，即defalutName与data对象的name双向绑定了
```
let defalutName = ''
let data = {name:''};

function observer (data) {
  //Object.defineProperty直接在对象上定义新属性，或修改对象上的现有属性，然后返回对象。
//不了解的请转MDN文档 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
  Object.defineProperty(data, 'name', {
    get(){
      return defalutName
    },
    set(newValue){
      defalutName = newValue
    }
  });
}
// 
observer(data)
console.log(data.name);
// expected output: ''

// 给data里面的name赋值 = "Eno"
data.name = 'Eno'
console.log(data.name);   // expected output: Eno

console.log(defalutName); // expected output: Eno
```


#### 3.接下来我们对observer函数进行改造
> 上面我们的observer对象并没有对data的所有值进行监听，接下来我们完善oberver函数如下:

```

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
         console.log('获取了值') // 在此做依赖收集的操作
          return value 
      },
      set(newValue){
          if(newValue !== value){
              console.log('设置了值')
              value = newValue
          }
      }
  });
}

let data = {name:'',age:18};
observer(data)

// 给data里面的name赋值 = "Eno"
data.name = 'Eno'
console.log(data.name);  
// 设置了值
// 获取了值
// Eno
 data.age = 12
 console.log(data.age); 
// 设置了值
// 获取了值
// 12
```
- 输入如图
![image.png](https://upload-images.jianshu.io/upload_images/11447772-48d34407896e73ab.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
此时更新data里面的所有值都触发了defineProperty 的get和set方法

> 补充：什么是依赖收集？ 我们都知道，当一个可观测对象的属性被读写时，会触发它的getter/setter方法。如果我们可以在可观测对象的getter/setter里面，执行监听器里面的update()方法；不就能够让对象主动发出通知了吗?

![依赖收集.png](https://upload-images.jianshu.io/upload_images/11447772-1817c79a434f6eba.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 4. 假如给data添加不存在key会如何呢？
```
// ...
let data = {name:'',age:18};
observer(data)

// 给data里面的name赋值 = "Eno"
// data.name = 'Eno'
// console.log(data.name);  
//  data.age = 12
//  console.log(data.age); 
data.gender = '男'

```
输出结果如下：
![image.png](https://upload-images.jianshu.io/upload_images/11447772-0c220fe512e1f909.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
> 由图可知，并没有触发set和get，这个因为，在我们对data进行监测的时候是没有gender这个属性值的，因此我们如果想要对新增的属性进行监听的话，需要在赋值后再进行一次监听，即vm.$set的效果；我们可以创建一个reactiveSet函数如下：
```
function reactiveSet (data,key,value) {
  data[key] = value
  observer(data)
}


let data = {name:'',age:18};
observer(data)

// 给data里面的name赋值 = "Eno"
// data.name = 'Eno'
// console.log(data.name);  
//  data.age = 12
//  console.log(data.age); 
// 通过reactiveSet添加属性
reactiveSet(data,'gender','男')
console.log(data.gender)

```
执行结果如下：
![image.png](https://upload-images.jianshu.io/upload_images/11447772-664131234dd96fc6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
> 此时是可以响应的，不过vue并不是这样做的，下面可以看vue的源码
[vuejs in github](https://github.com/vuejs/vue/blob/dev/src/core/observer/index.js)
里面是这样判断的，如果这个key目前没有存在于对象中，那么会进行赋值并监听。但是这里省略了ob的判断；

> 补充: `ob是什么呢?` vue初始化的数据(如data中的数据)在页面初始化的时候都会被监听，而被监听的属性都会被绑定__ob__属性，下图就是判断这个数据有没有被监听的。如果这个数据没有被监听，那么就默认你不想监听这个数据，所以直接赋值并返回

![image.png](https://upload-images.jianshu.io/upload_images/11447772-0f98f2cf8e88b087.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 5. 假如data里面的数据是多层嵌套对象呢？
> 目前，我们是对data一个简单对象进行监听，思考🤔一下假如是多层对象该如何调整及修改observer呢？

- 其实很简单, 我们只需要在observer调用的defineReactive函数里边对value值进行递归监听就可以实现，但这种方式，会有一定性能问题；defineReactive修改如下:
```
// ...
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
// ...
```

----------
> 2019年10月21日更新

#### 6. 假如data里面的数据是多层嵌套数组呢？
> 假如data里面的对象里面有数组，那么需要对数组进行拦截，如果数组里面是多维数组，还需和5.嵌套对象的做法一致，还需要进行递归监听，observer修改如下：

```
function observer(data){
  // 判断是否为对象 如果不是则直接返回，Object.defineProperty是对象上的属性
  if(typeof data !== 'object' || data == null){
    return data;
  }
  if(Array.isArray(data)){ // 如果是数组,则对数据进行遍历并对其value进行递归监听
    for(let i = 0; i< data.length ;i++){
        observer(data[i]);
    }
  } else {
    for(let key in data){
      defineReactive(data,key,data[key]);
    }
  }
}
// ...
// ...

let data = {name:'',age:18};
observer(data)

// 给data里面的name赋值 = "Eno"
// data.name = 'Eno'
// console.log(data.name);  
//  data.age = 12
//  console.log(data.age); 
// reactiveSet(data,'gender','男')
// console.log(data.gender)


reactiveSet(data,'attr',[1,2,3,4,5,100])
console.log(data.attr)
```
- 执行输出结果如下：
![image.png](https://upload-images.jianshu.io/upload_images/11447772-acfef8cfd9a26639.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 从上图可以看出，在reactiveSet的情况下，即使给data设置了不存在的数组，也能够得到监听，接下来尝试对数组进行修改测试；
```
// ...
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
```
- 结果输出如下: 此时对数据push或者删除其中某个元素，很明显observer并未监测到其变化：
[image.png](https://upload-images.jianshu.io/upload_images/11447772-0f3330132b29c6a4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


> 究其原因:由于数组的方法在对数组的增删查改过程中，vue并没其操作更新视图的操作，故此时是不能响应式的，因此如果需要对此类方法的调用时，通过视图更新，则需要对数组方法`重写`，查看[vue/array.js](https://github.com/vuejs/vue/blob/dev/src/core/observer/array.js)源码可知:

![image.png](https://upload-images.jianshu.io/upload_images/11447772-3973f37fcadf97e6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 其中：def的源码如下： 即对obj的属性进行了重写或者称之为元素的属性重新定义
![image.png](https://upload-images.jianshu.io/upload_images/11447772-1f354d0840b60eb1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 接下来我们写一个简陋版的数组重写:

```
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
    // 函数劫持 把函数进行重写 
    // 而内部实际上继续调用原来的方法但在这里我们可以去调用更新视图的方法
     console.log('数组 更新啦...')
      arrayProto[method].call(this,...arguments)
  }
});
```
- 并且在observer中设置新的数组方法;
```

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
```
 - 此时，所有代码如下：
```
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

```
运行结果如下:
![image.png](https://upload-images.jianshu.io/upload_images/11447772-5d4216de28933743.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 看到视图真的更新了，不得不佩服尤大大真的厉害，听说2020年第一季度就要出vue3.0了，接下来要写篇vue3.0的初步学习文章，希望各位看官支持，不要忘记点赞喔；

文章源码:[github  wLove-c](https://github.com/wLove-c/JavaScript-demo)



---------
>  总结: 能力有限，暂时先写这么多，接下来有时间会写一篇vue-next的源码实践和理解, 希望各位看官大人不要忘记点赞哈，写的不好的地方欢迎指正；



### vue3.0使用小测

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
  <div id="app"></div>
  <script src="vue.global.js"></script>
  <script>
    console.log('Vue====',Vue)
    const App = {
        setup() {
          // reactive state
          let count =  Vue.reactive({value:1}) // 知乎上尤大大推荐的是使用 const count = value(0) 但目前这个版本是没有value的 先用reactive做响应
          // computed state
          const plusOne = Vue.computed(() => count.value * 2)
          // method
          const increment = () => {
             count.value++ 

            }
          // watch
          Vue.watch(() => count.value * 2, val => {
            console.log(`value * 2 is ${val}`)
          })
          // lifecycle
          Vue.onMounted(() => {
            console.log(`mounted`)
          })
          // expose bindings on render context
          return {
            count,
            plusOne,
            increment
          }
        },
        template: `
          <div>
            <div>count is {{ count.value }}</div>
            <span>plusOne is {{ plusOne }}</span>
            <button @click="increment">count++</button>
          </div>
        `,
      }
    Vue.createApp().mount(App,app)
  </script>
</body>
</html>
```
