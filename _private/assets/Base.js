/**
 * J+ Library, 1.0
 * @projectDescription jPlusUI: 一个轻量但完整的 Web UI 组件库。
 * @copyright 2011-2012 J+ Team
 * @license The BSD License
 * @author xuld
 * @fileOverview 定义最基本的工具函数。
 * @pragma defaultExtends JPlus.Base
 */

// 可用的宏
// 	CompactMode - 兼容模式 - 支持 IE6+ FF3+ Chrome10+ Opera10.5+ Safari5+ , 若无此宏，将只支持 HTML5。
// 	Publish - 启用发布操作 - 删除 assert 、 trace 、 imports 和 using 支持。


(function (window, undefined) {

	/// #region Core

	/**
	 * document 简写。
	 * @type Document
	 */
	var document = window.document,

        /**
         * Object 简写。
         * @type Function
         */
        Object = window.Object,

		/**
		 * Array.prototype 简写。
		 * @type  Object
		 */
		ap = Array.prototype,

		/**
		 * Object.prototype.toString 简写。
		 * @type Function
		 */
		toString = Object.prototype.toString,

		/**
		 * Object.prototype.hasOwnProperty 简写。
		 * @type Function
		 */
		hasOwnProperty = Object.prototype.hasOwnProperty,

		/**
		 * 空对象。
		 * @type Object
		 */
		emptyObj = {},

		/**
		 * 包含系统有关的函数。
		 * @type Object
		 * @namespace JPlus
		 */
		JPlus = window.JPlus = {

			/**
			 * 所有类的基类。
			 * @abstract class
			 * {@link JPlus.Base} 提供了全部类都具有的基本函数。
			 */
			Base: Base,

			/**
			 * 将一个原生的 Javascript 函数对象转换为一个类。
			 * @param {Function/Class} constructor 用于转换的对象，将修改此对象，让它看上去和普通的类一样。
			 * @return {Function} 返回生成的类。
			 * @remark 转换后的类将有继承、扩展等功能。
			 * @example <pre>
			 * function myFunc(){}
			 * 
			 * JPlus.Native(myFunc);
			 * 
			 * // 现在可以直接使用 implement 函数了。
			 * myFunc.implement({
			 * 	  a: 2
			 * });
			 * </pre>
			 */
			Native: function (constructor) {

				// JPlus 创建的类和普通的 Javascript 函数的最大区别在于:
				// JPlus 创建的类还拥有 classMembers 指定的成员。
				// 因此，将普通函数转换为 JPlus 类的方法就是复制 classMembers 下的方法。
				return extend(constructor, classMembers);
			},

			/**
			 * id种子 。
			 * @type Number
			 * @defaultValue 1
			 * @example 下例演示了 JPlus.id 的用处。
			 * <pre>
			 *		var uid = JPlus.id++;  // 每次使用之后执行 ++， 保证页面内的 id 是唯一的。
			 * </pre>
			 */
			id: 1,

			/**
			 * 获取当前框架的版本号。
			 * @getter
			 */
			version: /*@VERSION*/1.00

		},
		
		/**
		 * 类成员方法。
		 * @type Object
		 * @namespace JPlus.Base
		 */
		classMembers = {

			/**
			 * 扩展当前类的动态方法。
			 * @param {Object} members 用于扩展的成员列表。
			 * @return this
			 * @see #implementIf
			 * @example 以下示例演示了如何扩展 Number 类的成员。<pre>
			 * Number.implement({
			 *   sin: function () {
			 * 	    return Math.sin(this);
			 *  }
			 * });
			 *
			 * (1).sin();  //  Math.sin(1);
			 * </pre>
			 */
			implement: function (members) {

				assert(this.prototype, "MyClass.implement(members): 无法扩展当前类，因为当前类的 prototype 为空。");

				// 直接将成员复制到原型上即可 。
				Object.extend(this.prototype, members);

				return this;
			},

			/**
			 * 扩展当前类的动态方法，但不覆盖已存在的成员。
			 * @param {Object} members 成员。
			 * @return this
			 * @see #implement
			 */
			implementIf: function (members) {

				assert(this.prototype, "MyClass.implementIf(members): 无法扩展当前类，因为当前类的 prototype 为空。");

				Object.extendIf(this.prototype, members);

				return this;
			},

			/**
			 * 添加当前类的动态方法，该方法基于某个属性的同名方法实现。
			 * @param {String} targetProperty 要基于的属性名。
			 * @param {String} setters=undefined 设置函数的方法名数组，用空格隔开。
			 * @param {String} getters=undefined 获取函数的方法名数组，用空格隔开。
             * @remark 使用此函数只能传递最多 3 个参数。
			 * @example <pre>
			 * MyClass.defineMethods('field', 'fn1 fn2 fn3');
			 * </pre>
			 * 等价于 <pre>
			 * MyClass.implement({
			 * 		fn1:  function(){ 
			 * 			return this.field.fn1();  
			 * 		},
			 * 		fn2:  function(){ 
			 * 			return this.field.fn2();  
			 * 		},
			 * 		fn3:  function(){ 
			 * 			this.field.fn();
			 * 			return this;
			 * 		}
			 * 	// 如果源函数返回 this, 将更新为当前的 this 。
			 * });
			 * </pre>
			 */
			defineMethods: function(targetProperty, methods, args) {
				
				assert.isString(methods, "MyClass.defineMethods(targetProperty, methods): {methods} ~");
				
				var propertyGetterFunc;
				
				if(/\(\)$/.test(targetProperty)){
					propertyGetterFunc = targetProperty.substr(0, targetProperty.length - 2);
				}
				
				// 最后使用 implement 添加成员。
				return this.implement(Object.map(methods, function(fnName) {
				    return function (arg0, arg1, arg2) {
						
						// 获取实际调用的函数目标对象。
						var target = propertyGetterFunc ? this[propertyGetterFunc]() : this[targetProperty],
							r;
							
						assert(target, "#" + targetProperty + " 不能为空。");
						assert(!target || target[fnName], "#" + targetProperty + "." + fnName + "(): 不是函数。");

						r = target[fnName];
						
				        // 调用被代理的实际函数。
                        // 不能使用 .apply: IE 6/7 原生函数不是 function 。
						r = r.apply ? r.apply(target, arguments) : r(arg0, arg1, arg2);
						
						// 如果不是 getter，返回 this 链式引用。
						return target === r || r === undefined ? this : r;
					};
				}, {}), args);  // 支持 Dom.implement, 传递第二个参数。
			},

			/**
			 * 为当前类注册一个事件。
			 * @param {String} eventName 事件名。如果多个事件使用空格隔开。
			 * @param {Object} properties={} 事件信息。 具体见备注。
			 * @return this
			 * @remark
			 * 事件信息是一个JSON对象，它表明了一个事件在绑定、删除和触发后的一些操作。
			 *
			 * 事件信息的原型如:
			 * <pre>
			 * ({
			 *
			 *  // 当用户执行 target.on(type, fn) 时执行下列函数:
			 * 	add: function(target, type, fn){
			 * 		// 其中 target 是目标对象，type是事件名， fn是执行的函数。
			 *  },
			 *
			 *  // 当用户执行 target.un(type, fn) 时执行下列函数:
			 *  remove: function(target, type, fn){
			 * 		// 其中 target 是目标对象，type是事件名， fn是执行的函数。
			 *  },
			 *
			 *  // 当用户执行 target.trigger(e) 时执行下列函数:
			 *  dispatch: function(target, type, fn, e){
			 * 		// 其中 target 是目标对象，type是事件名， fn是执行的函数。e 是参数。
			 *  }
			 *
			 * });
			 * </pre>
			 *
			 * 当用户使用 obj.on('事件名', 函数) 时， 系统会判断这个事件是否已经绑定过， 如果之前未绑定事件，则会创建新的函数
			 * evtTrigger， evtTrigger 函数将遍历并执行 evtTrigger.handlers 里的成员,
			 * 如果其中一个函数执行后返回 false， 则中止执行，并返回 false， 否则返回 true。
			 * evtTrigger.handlers 表示 当前这个事件的所有实际调用的函数的数组。
			 * 然后系统会调用 add(obj, '事件名', evtTrigger) 然后把 evtTrigger 保存在 obj.dataField().$event['事件名'] 中。
			 * 如果 之前已经绑定了这个事件，则 evtTrigger 已存在，无需创建。 这时系统只需把 函数 放到 evtTrigger.handlers 即可。
			 *
			 * 真正的事件触发函数是 evtTrigger， evtTrigger会执行 initEvent 和用户定义的一个事件全部函数。
			 *
			 * 当用户使用 obj.un('事件名', 函数) 时， 系统会找到相应 evtTrigger， 并从
			 * evtTrigger.handlers 删除 函数。 如果 evtTrigger.handlers 是空数组， 则使用
			 * remove(obj, '事件名', evtTrigger) 移除事件。
			 *
			 * 当用户使用 obj.trigger(参数) 时， 系统会找到相应 evtTrigger， 如果事件有trigger， 则使用
			 * dispatch(obj, '事件名', evtTrigger, 参数) 触发事件。 如果没有， 则直接调用
			 * evtTrigger(参数)。
			 *
			 * 下面分别介绍各函数的具体内容。
			 *
			 * add 表示 事件被绑定时的操作。 原型为:
			 *
			 * <pre>
			 * function add(elem, type, fn) {
			 * 	   // 对于标准的 DOM 事件， 它会调用 elem.addEventListener(type, fn, false);
			 * }
			 * </pre>
			 *
			 * elem表示绑定事件的对象，即类实例。 type 是事件类型， 它就是事件名，因为多个事件的 add 函数肯能一样的，
			 * 因此 type 是区分事件类型的关键。fn 则是绑定事件的函数。
			 *
			 * remove 类似 add。
			 *
			 * $default 是特殊的事件名，它的各个信息将会覆盖同类中其它事件未定义的信息。
			 *
			 * @example 下面代码演示了如何给一个类自定义事件，并创建类的实例，然后绑定触发这个事件。
			 * <pre>
			 * // 创建一个新的类。
			 * var MyCls = new Class();
			 *
			 * MyCls.addEvents('click', {
			 *
			 * 		add:  function (elem, type, fn) {
			 * 	   		alert("为  elem 绑定 事件 " + type );
			 * 		}
			 *
			 * });
			 *
			 * var m = new MyCls;
			 * m.on('myEvt', function () {  //  输出 为  elem 绑定 事件  myEvt
			 * 	  alert(' 事件 触发 ');
			 * });
			 *
			 * m.trigger('myEvt', 2);
			 *
			 * </pre>
			 */
			addEvents: function (eventName, properties) {

				assert.isString(eventName, "MyClass.addEvents(eventName, properties): {eventName} ~");
				
				// 获取存储事件信息的变量。如果不存在则创建。
				var eventObj = this.$event || (this.$event = {}),
					defaultEvent = eventObj.$default;
					
				if(properties) {
					Object.extendIf(properties, defaultEvent);
					
					// 处理 base: 'event' 字段，自动生成 add 和 remove 函数。
					if(properties.base) {
						assert(defaultEvent, "使用 base 字段功能必须预先定义 $default 事件。");
						properties.add = function(obj, type, fn){
							defaultEvent.add(obj, this.base, fn);
						};
						
						properties.remove = function(obj, type, fn){
							defaultEvent.remove(obj, this.base, fn);
						};
					}
				} else {
					properties = defaultEvent || emptyObj;
				}

				// 将 eventName 指定的事件对象都赋值为 properties。
				Object.map(eventName, properties, eventObj);

				return this;
			},

			/**
			 * 继承当前类创建并返回子类。
			 * @param {Object/Function} [methods] 子类的员或构造函数。
			 * @return {Function} 返回继承出来的子类。
			 * @remark
			 * 在 Javascript 中，继承是依靠原型链实现的， 这个函数仅仅是对它的包装，而没有做额外的动作。
			 *
			 * 成员中的 constructor 成员 被认为是构造函数。
			 *
			 * 这个函数实现的是 单继承。如果子类有定义构造函数，则仅调用子类的构造函数，否则调用父类的构造函数。
			 *
			 * 要想在子类的构造函数调用父类的构造函数，可以使用 {@link JPlus.Base#base} 调用。
			 *
			 * 这个函数返回的类实际是一个函数，但它被 {@link JPlus.Native} 修饰过。
			 *
			 * 由于原型链的关系， 肯能存在共享的引用。 如: 类 A ， A.prototype.c = []; 那么，A的实例 b ,
			 * d 都有 c 成员， 但它们共享一个 A.prototype.c 成员。 这显然是不正确的。所以你应该把 参数 quick
			 * 置为 false ， 这样， A创建实例的时候，会自动解除共享的引用成员。 当然，这是一个比较费时的操作，因此，默认
			 * quick 是 true 。
			 *
			 * 也可以把动态成员的定义放到 构造函数， 如: this.c = []; 这是最好的解决方案。
			 *
			 * @example 下面示例演示了如何创建一个子类。
			 * <pre>
			 * var MyClass = new Class(); //创建一个类。
			 *
			 * var Child = MyClass.extend({  // 创建一个子类。
			 * 	  type: 'a'
			 * });
			 *
			 * var obj = new Child(); // 创建子类的实例。
			 * </pre>
			 */
			extend: function (members) {

			    // 未指定函数 使用默认构造函数(Object.prototype.constructor);

				// 生成子类 。
			    var subClass = members && members.hasOwnProperty("constructor") ? members.constructor : function () {

					// 调用父类构造函数 。
					arguments.callee.base.apply(this, arguments);

				};

				// 代理类 。
				emptyFn.prototype = (subClass.base = this).prototype;

				// 指定成员 。
				subClass.prototype = Object.extend(new emptyFn, members);

				// 覆盖构造函数。
				subClass.prototype.constructor = subClass;

				// 清空临时对象。
				emptyFn.prototype = null;

				// 创建类 。
				return JPlus.Native(subClass);

			}

		};

	/// #endregion

	/// #region Functions

	/**
	 * 系统原生的对象。
	 * @static class Object
	 */
	extend(Object, {

		/// #if CompactMode

		/**
		 * 复制对象的所有属性到其它对象。
		 * @param {Object} dest 复制的目标对象。
		 * @param {Object} src 复制的源对象。
		 * @return {Object} 返回 *dest*。
		 * @see Object.extendIf
		 * @example <pre>
	     * var a = {v: 3}, b = {g: 2};
	     * Object.extend(a, b);
	     * trace(a); // {v: 3, g: 2}
	     * </pre>
		 */
		extend: (function () {
			for (var item in {
				toString: 1
			})
				return extend;

			JPlus.enumerables = "toString hasOwnProperty valueOf constructor isPrototypeOf".split(' ');
			// IE6 不会遍历系统对象需要复制，所以强制去测试，如果改写就复制 。
			return function (dest, src) {
				if (src) {
					assert(dest != null, "Object.extend(dest, src): {dest} 不可为空。", dest);

					for (var i = JPlus.enumerables.length, value; i--;)
						if (hasOwnProperty.call(src, value = JPlus.enumerables[i]))
							dest[value] = src[value];
					extend(dest, src);
				}

				return dest;
			}
		})(),

		/// #else

		/// extend: extend,

		/// #endif

		/**
		 * 复制对象的所有属性到其它对象，但不覆盖原对象的相应值。
		 * @param {Object} dest 复制的目标对象。
		 * @param {Object} src 复制的源对象。
		 * @return {Object} 返回 *dest*。
		 * @see Object.extend
		 * @example
		 * <pre>
	     * var a = {v: 3, g: 5}, b = {g: 2};
	     * Object.extendIf(a, b);
	     * trace(a); // {v: 3, g: 5}  b 未覆盖 a 任何成员。
	     * </pre>
		 */
		extendIf: function (dest, src) {

			assert(dest != null, "Object.extendIf(dest, src): {dest} 不可为空。", dest);

			// 和 extend 类似，只是判断目标的值，如果不是 undefined 然后拷贝。
			for (var b in src)
				if (dest[b] === undefined)
					dest[b] = src[b];
			return dest;
		},

		/**
		 * 遍历一个类数组，并对每个元素执行函数 *fn*。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 可以让函数返回 **false** 来强制中止循环。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @return {Boolean} 如果循环是因为 *fn* 返回 **false** 而中止，则返回 **false**， 否则返回 **true**。
		 * @see Array#each
		 * @see Array#forEach
		 * @example
		 * <pre>
	     * Object.each({a: '1', c: '3'}, function (value, key) {
	     * 		trace(key + ' : ' + value);
	     * });
	     * // 输出 'a : 1' 'c : 3'
	     * </pre>
		 */
		each: function (iterable, fn, scope) {

			assert(typeof iterable !== 'function', "Object.each(iterable, fn, scope): {iterable} 不能是函数。 ", iterable);
			assert(typeof fn === 'function', "Object.each(iterable, fn, scope): {fn} 必须是函数。", fn);
			
			// 如果 iterable 是 null， 无需遍历 。
			if (iterable != null) {

				// 普通对象使用 for( in ) , 数组用 0 -> length 。
				if (typeof iterable.length !== "number") {

					// Object 遍历。
					for (var key in iterable)
						if (fn.call(scope, iterable[key], key, iterable) === false)
							return false;
				} else {
					return each.call(iterable, fn, scope);
				}

			}

			// 正常结束返回 true。
			return true;
		},

		/**
		 * 遍历一个类数组对象并调用指定的函数，返回每次调用的返回值数组。
		 * @param {Array/String/Object} iterable 任何对象，不允许是函数。如果是字符串，将会先将字符串用空格分成数组。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @param {Object} [dest] 仅当 *iterable* 是字符串时，传递 *dest* 可以将函数的返回值保存到 dest。
		 * @return {Object/Undefiend} 返回的结果对象。当 *iterable* 是字符串时且未指定 dest 时，返回空。
		 * @example
		 * <pre>
		 * 
		 * // 传统的 map 用法:
		 * 
	     * Object.map(["a","b"], function(a){
	     * 	  return a + a;
	     * }); // => ["aa", "bb"];
	     *
	     * Object.map({a: "a", b: "b"}, function(a){
	     * 	  return a + a
	     * }); // => {a: "aa", b: "bb"};
	     *
	     * Object.map({length: 1, "0": "a"}, function(a){
	     * 	   return a + a
	     * }); // => ["a"];
	     * 
	     * // 字符串 map 用法:
	     *
	     * Object.map("a b", function(a){
	     * 		return a + a
	     * }, {}); // => {a: "aa", b: "bb"};
	     *
	     * Object.map("a b", function(a){
	     * 		return a + a
	     * }); // => undefined; 注意: 如果未指定 dest，则结果值将丢失。
	     *
	     * Object.map("a b", 3, {}); // => {a: 3, b: 3};
	     * </pre>
		 */
		map: function (iterable, fn, dest) {

			var actualFn;

			// 如果是目标对象是一个字符串，则改为数组。
			if (typeof iterable === 'string') {
				iterable = iterable.split(' ');
				actualFn = typeof fn === 'function' ? dest ? function (value, key, array) {
					this[value] = fn(value, key, array);
				} : fn : function(value){
					this[value] = fn;
				}
			} else {
				dest = typeof iterable.length !== "number" ? {} : [];
				actualFn = function (value, key, array) {
					this[key] = fn(value, key, array);
				};
			}

			// 遍历对象。
			Object.each(iterable, actualFn, dest);

			// 返回目标。
			return dest;
		}

	});

    /**
     * 表示一个空函数。这个函数总是返回 undefined 。
     * @property
     * @type Function
     * @remark
     * 在定义一个类的抽象函数时，可以让其成员的值等于 **Function.empty** 。
     */
	Function.empty = emptyFn;

	/**
	 * 格式化指定的字符串。
	 * @param {String} formatString 要格式化的字符串。格式化的方式见备注。
	 * @param {Object} ... 格式化用的参数。
	 * @return {String} 格式化后的字符串。
  	 * @remark 
  	 * 
  	 * 格式化字符串中，使用 {0} {1} ... 等元字符来表示传递给 String.format 用于格式化的参数。
  	 * 如 String.format("{0} 年 {1} 月 {2} 日", 2012, 12, 32) 中， {0} 被替换成 2012，
  	 * {1} 被替换成 12 ，依次类推。
  	 * 
  	 * String.format 也支持使用一个 JSON来作为格式化参数。
  	 * 如 String.format("{year} 年 {month} 月 ", { year: 2012, month:12});
  	 * 若要使用这个功能，请确保 String.format 函数有且仅有 2个参数，且第二个参数是一个 Object。
  	 * 
  	 * 格式化的字符串{}不允许包含空格。
  	 * 
  	 * 默认地，String.format 将使用函数的作用域(默认为 String) 函数将参数格式化为字符串后填入目标字符串。
  	 * 因此在使用 String.format 时，应该保证 String.format 的作用域为 String 或其它格式化函数。
  	 * 
  	 * 如果需要在格式化字符串中出现 { 和 }，请分别使用 {{ 和 }} 替代。
	 * 不要出现{{{ 和 }}} 这样将获得不可预知的结果。
	 * @memberOf String
	 * @example <pre>
	 *  String.format("{0}转换", 1); //  "1转换"
	 *  String.format("{1}翻译",0,1); // "1翻译"
	 *  String.format("{a}翻译",{a:"也可以"}); // 也可以翻译
	 *  String.format("{{0}}不转换, {0}转换", 1); //  "{0}不转换1转换"
	 * </pre>
	 */
	String.format = function (formatString, args) {

		assert(!formatString || formatString.replace, 'String.format(formatString, args): {formatString} 必须是字符串。', formatString);

		// 支持参数2为数组或对象的直接格式化。
		var toString = this;

		args = arguments.length === 2 && args && typeof args === 'object' ? args : ap.slice.call(arguments, 1);

		// 通过格式化返回
		return formatString ? formatString.replace(/\{+?(\S*?)\}+/g, function (match, name) {
			var start = match.charAt(1) == '{', end = match.charAt(match.length - 2) == '}';
			if (start || end)
				return match.slice(start, match.length - end);
			return name in args ? toString(args[name]) : "";
		}) : "";
	};

    /**
	 * 系统原生的数组对象。
	 * @class Array
	 */
	if (!Array.isArray) {


	    /**
		 * 判断一个变量是否是数组。
		 * @param {Object} obj 要判断的变量。
		 * @return {Boolean} 如果是数组，返回 true， 否则返回 false。
		 * @example
		 * <pre>
	     * Array.isArray([]); // true
	     * Array.isArray(document.getElementsByTagName("div")); // false
	     * Array.isArray(new Array); // true
	     * </pre>
		 */
	    Array.isArray = function (obj) {
	        return toString.call(obj) === "[object Array]";
	    }

	}

	/// #if CompactMode

	/**
	 * 系统原生的日期对象。
	 * @class Date
	 */
	if (!Date.now) {

		/**
		 * 获取当前时间的数字表示。
		 * @return {Number} 当前的时间点。
		 * @static
		 * @example
		 * <pre>
		 * Date.now(); //   相当于 new Date().getTime()
		 * </pre>
		 */
		Date.now = function () {
			return +new Date;
		};

	}

	/// #endif

	/**
	 * @namespace window
	 */

	/**
	 * 创建一个类。
	 * @param {Object/Function} [methods] 类成员列表对象或类构造函数。
	 * @return {Function} 返回创建的类。
	 * @see JPlus.Base
	 * @see JPlus.Base.extend
	 * @example 以下代码演示了如何创建一个类:
	 * <pre>
	 * var MyCls = Class({
	 *
	 *    constructor: function (a, b) {
	 * 	      alert('构造函数执行了 ' + a + b);
	 *    },
	 *
	 *    say: function(){
	 *    	alert('调用了 say 函数');
	 *    }
	 *
	 * });
	 *
	 *
	 * var c = new MyCls('参数1', '参数2');  // 创建类。
	 * c.say();  //  调用 say 方法。
	 * </pre>
	 */
	window.Class = function (members) {
		
		// 所有类都是继承 JPlus.Base 创建的。
		return Base.extend(members);
	};

	if (!window.execScript) {

		/**
		 * 在全局作用域运行一个字符串内的代码。
		 * @param {String} statement Javascript 语句。
		 * @example
		 * <pre>
		 * execScript('alert("hello")');
		 * </pre>
		 */
		window.execScript = function (statements) {

			assert.isString(statements, "execScript(statements): {statements} ~");

			// 如果正常浏览器，使用 window.eval 。
			window["eval"].call(window, statements);

		};

	}

	/// #endregion

	/// #region Navigator

	/**
	 * 系统原生的浏览器对象实例。
	 * @type Navigator
	 * @namespace navigator
	 */
	(function (navigator) {

		// 检查信息
		var ua = navigator.userAgent,

			match = ua.match(/(IE|Firefox|Chrome|Safari|Opera)[\/\s]([\w\.]*)/i) || ua.match(/(WebKit|Gecko)[\/\s]([\w\.]*)/i) || [0, "", 0],

			// 浏览器名字。
			browser = match[1],
			
			// IE678 = false, 其它 = true
			isStd = !!+"\v1";

		navigator["is" + browser] = navigator["is" + browser + parseInt(match[2])] = true;

		/**
		 * 获取一个值，该值指示是否为 IE 浏览器。
		 * @getter isIE
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE6 浏览器。
		 * @getter isIE6
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE7 浏览器。
		 * @getter isIE7
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE8 浏览器。
		 * @getter isIE8
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE9 浏览器。
		 * @getter isIE9
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE10 浏览器。
		 * @getter isIE10
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Firefox 浏览器。
		 * @getter isFirefox
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Chrome 浏览器。
		 * @getter isChrome
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Opera 浏览器。
		 * @getter isOpera
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Opera10 浏览器。
		 * @getter isOpera10
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Safari 浏览器。
		 * @getter isSafari
		 * @type Boolean
		 */

		// 结果
		extend(navigator, {

			/// #if CompactMode

			/**
			 * 判断当前浏览器是否符合W3C标准。
			 * @getter
			 * @type Boolean
			 * @remark 就目前浏览器状况， 除了 IE6, 7, 8， 其它浏览器都返回 true。
			 */
			isStd: isStd,

			/**
			 * 获取一个值，该值指示当前浏览器是否支持标准事件。
			 * @getter
			 * @type Boolean
			 * @remark 就目前浏览器状况， IE6，7 中 isQuirks = true 其它浏览器都为 false 。
			 */
			isQuirks: !isStd && typeof document.constructor !== 'object',

			/// #endif

			/**
			 * 获取当前浏览器的名字。
			 * @getter
			 * @type String
			 * @remark
			 * 肯能的值有:
			 *
			 * - IE
			 * - Firefox
			 * - Chrome
			 * - Opera
			 * - Safari
			 *
			 * 对于其它非主流浏览器，返回其 HTML 引擎名:
			 *
			 * - Webkit
			 * - Gecko
			 * - Other
			 */
			name: browser,

			/**
			 * 获取当前浏览器版本。
			 * @getter
			 * @type String
			 * @remark 输出的格式比如 6.0.0 。 这是一个字符串，如果需要比较版本，应该使用
			 * <pre>
			 *       parseFloat(navigator.version) <= 5.5 。
			 * </pre>
			 */
			version: match[2]

		});

	})(window.navigator);

	/// #endregion

	/// #region Methods

	// 把所有内建对象本地化 。
	each.call([String, Array, Function, Date, Base], JPlus.Native);

	/**
	 * 所有由 new Class 创建的类的基类。
	 * @class JPlus.Base
	 */
	Base.implement({

		/**
    	 * 获取当前类对应的数据字段。
    	 * @proteced virtual
    	 * @returns {Object} 一个可存储数据的对象。
    	 * @remark 默认地， 此返回返回 this 。
    	 * 此函数的意义在于将类对象和真实的数据对象分离。
    	 * 这样可以让多个类实例共享一个数据对象。
    	 * @example
    	 * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *    fn: function (a, b) {
	     * 	    alert(a + b);
	     *    }
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * a.dataField().myData = 2;
    	 * </pre>
    	 */
		dataField: function () {
			return this.$data || (this.$data = {});
		},

		/**
	     * 调用父类的成员函数。
	     * @param {String} fnName 调用的函数名。
	     * @param {Object} [...] 调用的参数。如果不填写此项，则自动将当前函数的全部参数传递给父类的函数。
	     * @return {Object} 返回父类函数的返回值。
	     * @protected
	     * @example
	     * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *    fn: function (a, b) {
	     * 	    alert(a + b);
	     *    }
	     * });
	     *
	     * // 创建一个子类 B
	     * var B = A.extend({
	     * 	  fn: function (a, b) {
	     * 	    this.base('fn'); // 子类 B#a 调用父类 A#a
	     * 	    this.base('fn', 2, 4); // 子类 B#a 调用父类 A#a
	     *    }
	     * });
	     *
	     * new B().fn(1, 2); // 输出 3 和 6
	     * </pre>
	     */
		base: function (fnName) {

			var me = this.constructor,

	            fn = this[fnName],

	            oldFn = fn,

	            args = arguments;

			assert(fn, "JPlus.Base#base(fnName, args): 子类不存在 {fnName} 的属性或方法。", fnName);

			// 标记当前类的 fn 已执行。
			fn.$bubble = true;

			assert(!me || me.prototype[fnName], "JPlus.Base#base(fnName, args): 父类不存在 {fnName} 的方法。", fnName);

			// 保证得到的是父类的成员。

			do {
				me = me.base;
				assert(me && me.prototype[fnName], "JPlus.Base#base(fnName, args): 父类不存在 {fnName} 的方法。", fnName);
			} while ('$bubble' in (fn = me.prototype[fnName]));

			assert.isFunction(fn, "JPlus.Base#base(fnName, args): 父类的成员 {fn}不是一个函数。  ");

			fn.$bubble = true;

			// 确保 bubble 记号被移除。
			try {
				if (args.length <= 1)
					return fn.apply(this, args.callee.caller.arguments);
				args[0] = this;
				return fn.call.apply(fn, args);
			} finally {
				delete fn.$bubble;
				delete oldFn.$bubble;
			}
		},

		/**
		 * 增加一个事件监听者。
		 * @param {String} eventName 事件名。
		 * @param {Function} eventHandler 监听函数。当事件被处罚时会执行此函数。
		 * @param {Object} scope=this *eventHandler* 执行时的作用域。
		 * @return this
		 * @example
		 * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * // 绑定一个 click 事件。
         * a.on('click', function (e) {
         * 		return true;
         * });
         * </pre>
		 */
		on: function (eventName, eventHandler, scope) {

			assert.isFunction(eventHandler, 'JPlus.Base#on(eventName, eventHandler, scope): {eventHandler} ~');

			// 获取本对象 本对象的数据内容 本事件值
			var me = this,
	        	data = me.dataField(),
	        	eventListener,
	        	eventManager;
			
			// 获取存储事件对象的空间。
			data = data.$event || (data.$event = {});
			
			// 获取当前事件对应的函数监听器。
			eventListener = data[eventName];
			
			// 生成默认的事件作用域。
			scope = [eventHandler, scope || me];

			// 如果未绑定过这个事件, 则不存在监听器，先创建一个有关的监听器。
			if (!eventListener) {
				
				// 获取事件管理对象。
				eventManager = getMgr(me, eventName);

				// 生成实际处理事件的监听器。
				data[eventName] = eventListener = function (e) {
					var eventListener = arguments.callee, 
						handlers = eventListener.handlers.slice(0), 
						handler,
						i = -1, 
						length = handlers.length;
					
					// 循环直到 return false。
					while (++i < length) {
						handler = handlers[i];
						if (handler[0].call(handler[1], e) === false) {
							
							// 如果存在 stopEvent 处理函数，则调用。
							// 如果当前函数是因为 initEvent 返回 false 引起，则不执行 stopEvent 。
							if(handler[2] !== true && (handler = eventListener.stop)){
								handler[0].call(handler[1], e);
							}
							return false;
						}
					}

					return true;
				};
				
				// 当前事件的全部函数。
				eventListener.handlers = eventManager.initEvent ? 
					[[eventManager.initEvent, me, true], scope] : 
					[scope];

				// 如果事件允许阻止，则存储字段。
				if(eventManager.stopEvent) {
					eventListener.stop = [eventManager.stopEvent, me];
				}

				// 如果事件支持自定义的添加方式，则先添加。
				if (eventManager.add) {
					eventManager.add(me, eventName, eventListener);
				}

			} else {
						
				// 添加到 handlers 。
				eventListener.handlers.push(scope);
			}


			return me;
		},

		/**
		 * 手动触发一个监听器。
		 * @param {String} eventName 监听名字。
		 * @param {Object} [e] 传递给监听器的事件对象。
		 * @return this
		 * @example <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * // 绑定一个 click 事件。
         * a.on('click', function (e) {
         * 		return true;
         * });
         *
         * // 手动触发 click， 即执行  on('click') 过的函数。
         * a.trigger('click');
         * </pre>
		 */
		trigger: function (eventName, e) {

			// 获取本对象 本对象的数据内容 本事件值 。
			var me = this, 
				data = me.dataField().$event, 
				eventManager;

			// 执行事件。
			return !data || !(data = data[eventName]) || ((eventManager = getMgr(me, eventName)).dispatch ? eventManager.dispatch(me, eventName, data, e) : data(e));

		},

		/**
		 * 删除一个或多个事件监听器。
		 * @param {String} [eventName] 事件名。如果不传递此参数，则删除全部事件的全部监听器。
		 * @param {Function} [eventHandler] 回调器。如果不传递此参数，在删除指定事件的全部监听器。
		 * @return this
		 * @remark
		 * 注意: `function () {} !== function () {}`, 这意味着下列代码的 un 将失败:
		 * <pre>
         * elem.on('click', function () {});
         * elem.un('click', function () {});   // 无法删除 on 绑定的函数。
         * </pre>
		 * 正确的做法是把函数保存起来。 <pre>
         * var fn =  function () {};
         * elem.on('click', fn);
         * elem.un('click', fn); // fn  被成功删除。
         *
         * 如果同一个 *eventListener* 被增加多次， un 只删除第一个。
         * </pre>
		 * @example
		 * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * var fn = function (e) {
         * 		return true;
         * };
	     *
	     * // 绑定一个 click 事件。
         * a.on('click', fn);
         *
         * // 删除一个 click 事件。
         * a.un('click', fn);
         * </pre>
		 */
		un: function (eventName, eventHandler) {

			assert(!eventHandler || typeof eventHandler === 'function', 'JPlus.Base#un(eventName, eventHandler): {eventHandler} 必须是函数。', eventHandler);

			// 获取本对象 本对象的数据内容 本事件值
			var me = this, 
				data = me.dataField().$event, 
				eventListener, 
				handlers, 
				i;
			
			if (data) {
				
				// 获取指定事件的监听器。
				if (eventListener = data[eventName]) {
					
					// 如果删除特定的处理函数。
					// 搜索特定的处理函数。
					if (eventHandler) {

						handlers = eventListener.handlers;
						i = handlers.length;

						// 根据常见的需求，这里逆序搜索有助于提高效率。
						while (i-- > 0) {
							
							if (handlers[i][0] === eventHandler) {
								
								// 删除 hander 。
								handlers.splice(i, 1);
								
								// 如果删除后只剩 0 个句柄，或只剩 1个 initEvent 句柄，则删除全部数据。
								if (!i || (i === 1 && handlers[0] === true)) {
									eventHandler = 0;
								}

								break;
							}
						}

					}

					// 检查是否存在其它函数或没设置删除的函数。
					if (!eventHandler) {

						// 删除对事件处理句柄的全部引用，以允许内存回收。
						delete data[eventName];
						
						// 获取事件管理对象。
						data = getMgr(me, eventName);

						// 内部事件管理的删除。
						if (data.remove)
							data.remove(me, eventName, eventListener);
					}
				} else if (!eventName) {
					for (eventName in data)
						me.un(eventName);
				}
			}
			return me;
		},

		/**
		 * 增加一个仅监听一次的事件监听者。
		 * @param {String} type 事件名。
		 * @param {Function} listener 监听函数。当事件被处罚时会执行此函数。
		 * @param {Object} scope=this *listener* 执行时的作用域。
		 * @return this
		 * @example <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
         * a.once('click', function (e) {
         * 		trace('click 被触发了');
         * });
         *
         * a.trigger('click');   //  输出  click 被触发了
         * a.trigger('click');   //  没有输出
         * </pre>
		 */
		once: function (eventName, eventHandler, scope) {

			assert.isFunction(eventHandler, 'JPlus.Base#once(eventName, eventHandler): {eventHandler} ~');

			// 先插入一个用于删除句柄的函数。
			return this.on(eventName, function(){
				this.un(eventName, eventHandler).un(eventName, arguments.callee);	
			}).on(eventName, eventHandler, scope);
		}

	});

	/**
	 * 系统原生的字符串对象。
	 * @class String
	 */
	String.implementIf({

		/// #if CompactMode

		/**
		 * 去除字符串的首尾空格。
		 * @return {String} 处理后的字符串。
		 * @remark 目前除了 IE8-，主流浏览器都已内置此函数。
		 * @example
		 * <pre>
	     * "   g h   ".trim(); //  返回     "g h"
	     * </pre>
		 */
		trim: function () {
			return this.replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, "");
		},

		/// #endif

		/**
		 * 将字符串转为骆驼格式。
		 * @return {String} 返回的内容。
		 * @remark
		 * 比如 "awww-bwww-cwww" 的骆驼格式为 "awwBwwCww"
		 * @example
		 * <pre>
	     * "font-size".toCamelCase(); //     "fontSize"
	     * </pre>
		 */
		toCamelCase: function () {
			return this.replace(/-(\w)/g, toUpperCase);
		},

		/**
		 * 将字符首字母大写。
		 * @return {String} 处理后的字符串。
		 * @example
		 * <pre>
	     * "aa".capitalize(); //     "Aa"
	     * </pre>
		 */
		capitalize: function () {

			// 使用正则实现。
			return this.replace(/(\b[a-z])/g, toUpperCase);
		}

	});

	/**
	 * 系统原生的函数对象。
	 * @class Function
	 */
	Function.implementIf({

		/**
		 * 绑定函数作用域(**this**)。并返回一个新函数，这个函数内的 **this** 为指定的 *scope* 。
		 * @param {Object} scope 要绑定的作用域的值。
		 * @example
		 * <pre>
		 * var fn = function(){ trace(this);  };
		 *
		 * var fnProxy = fn.bind(0);
		 *
	     * fnProxy()  ; //  输出 0
	     * </pre>
		 */
		bind: function (scope) {

			var me = this;
			
			// 返回对 scope 绑定。
			return function () {
				return me.apply(scope, arguments);
			}
		}

	});

	/**
	 * 系统原生的数组对象。
	 * @class Array
	 */
	Array.implementIf({

		/**
		 * 遍历当前数组，并对数组的每个元素执行函数 *fn*。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 可以让函数返回 **false** 来强制中止循环。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @return {Boolean} 如果循环是因为 *fn* 返回 **false** 而中止，则返回 **false**， 否则返回 **true**。
		 * @method
		 * @see Object.each
		 * @see #forEach
		 * @see #filter
		 * @see Object.map
		 * @remark
		 * 在高版本浏览器中，forEach 和 each 功能大致相同，但是 forEach 不支持通过 return false 中止循环。
		 * 在低版本(IE8-)浏览器中， forEach 为 each 的别名。
		 * @example 以下示例演示了如何遍历数组，并输出每个元素的值。
		 * <pre>
	     * [2, 5].each(function (value, index) {
	     * 		trace(value);
	     * });
	     * // 输出 '2 5'
	     * </pre>
	     *
	     * 以下示例演示了如何通过 return false 来中止循环。
	     * <pre>
	     * [2, 5].each(function (value, index) {
	     * 		trace(value);
	     * 		return false;
	     * });
	     * // 输出 '2'
	     * </pre>
		 */
		each: each,

		/**
		 * 如果当前数组中不存在指定 *value*， 则将 *value* 添加到当前数组的末尾。
		 * @param {Object} value 要添加的值。
		 * @return {Boolean} 如果此次操作已成功添加 *value*，则返回 **true**;
		 * 否则表示原数组已经存在 *value*，返回 **false**。
		 * @example
		 * <pre>
	     * ["", "aaa", "zzz", "qqq"].include(""); // 返回 true， 数组不变。
	     * [false].include(0);	// 返回 false， 数组变为 [false, 0]
	     * </pre>
		 */
		include: function (value) {
			var exists = this.indexOf(value) >= 0;
			if (!exists)
				this.push(value);
			return exists;
		},

		/**
		 * 对当前数组的每个元素调用其指定属性名的函数，并将返回值放入新的数组返回。
		 * @param {String} fnName 要调用的函数名。
		 * @param {Array} [args] 调用时的参数数组。
		 * @return {Array} 返回包含执行结果的数组。
		 * @example
		 * <pre>
	     * ["abc", "def", "ghi"].invoke('charAt', [0]); //  ['a', 'd', 'g']
	     * </pre>
		 */
		invoke: function (fnName, args) {
			assert(!args || typeof args.length === 'number', "Array#invoke(fnName, args): {args} 必须是参数数组。", args);
			var r = [];
			ap.forEach.call(this, function (value) {
				assert(value != null && value[fnName] && value[fnName].apply, "Array#invoke(fnName, args): {value} 不包含函数 {fnName}。", value, fnName);
				r.push(value[fnName].apply(value, args || []));
			});

			return r;
		},

		/**
		 * 删除数组中重复元素。
		 * @return {Array} this
		 * @example
		 * <pre>
	     * [1, 7, 8, 8].unique(); //    [1, 7, 8]
	     * </pre>
		 */
		unique: function () {

			// 删除从 i + 1 之后的当前元素。
			for (var i = 0, j, value; i < this.length;) {
				value = this[i];
				j = ++i;
				do {
					j = ap.remove.call(this, value, j);
				} while (j >= 0);
			}

			return this;
		},

		/**
		 * 删除当前数组中指定的元素。
		 * @param {Object} value 要删除的值。
		 * @param {Number} startIndex=0 开始搜索 *value* 的起始位置。
		 * @return {Number} 被删除的值在原数组中的位置。如果要擅长的值不存在，则返回 -1 。
		 * @remark
		 * 如果数组中有多个相同的值， remove 只删除第一个。
		 * @example
		 * <pre>
	     * [1, 7, 8, 8].remove(7); // 返回 1,  数组变成 [7, 8, 8]
	     * </pre>
	     *
	     * 以下示例演示了如何删除数组全部相同项。
	     * <pre>
	     * var arr = ["wow", "wow", "J+ UI", "is", "powerful", "wow", "wow"];
	     *
	     * // 反复调用 remove， 直到 remove 返回 -1， 即找不到值 wow
	     * while(arr.remove(wow) >= 0);
	     *
	     * trace(arr); // 输出 ["J+ UI", "is", "powerful"]
	     * </pre>
		 */
		remove: function (value, startIndex) {

			// 找到位置， 然后删。
			var i = ap.indexOf.call(this, value, startIndex);
			if (i !== -1)
				ap.splice.call(this, i, 1);
			return i;
		},

		/**
		 * 获取当前数组中指定索引的元素。
		 * @param {Number} index 要获取的元素索引。如果 *index* 小于 0， 则表示获取倒数 *index* 位置的元素。
		 * @return {Object} 指定位置所在的元素。如果指定索引的值不存在，则返回 undefined。
		 * @remark
		 * 使用 arr.item(-1) 可获取最后一个元素的值。
		 * @example
		 * <pre>
	     * [0, 1, 2, 3].item(0);  // 0
	     * [0, 1, 2, 3].item(-1); // 3
	     * [0, 1, 2, 3].item(5);  // undefined
	     * </pre>
		 */
		item: function (index) {
			return this[index < 0 ? this.length + index : index];
		},

		/// #if CompactMode

		/**
		 * 返回当前数组中某个值的第一个位置。
		 * @param {Object} item 成员。
		 * @param {Number} startIndex=0 开始查找的位置。
		 * @return {Number} 返回 *vaue* 的索引，如果不存在指定的值， 则返回-1 。
		 * @remark 目前除了 IE8-，主流浏览器都已内置此函数。
		 */
		indexOf: function (value, startIndex) {
			startIndex = startIndex || 0;
			for (var len = this.length; startIndex < len; startIndex++)
				if (this[startIndex] === value)
					return startIndex;
			return -1;
		},

		/**
		 * 对数组每个元素通过一个函数过滤。返回所有符合要求的元素的数组。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 如果函数返回 **true**，则当前元素会被添加到返回值数组。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @return {Array} 返回一个新的数组，包含过滤后的元素。
		 * @remark 目前除了 IE8-，主流浏览器都已内置此函数。
		 * @see #each
		 * @see #forEach
		 * @see Object.map
		 * @example
		 * <pre>
	     * [1, 7, 2].filter(function (key) {
	     * 		return key < 5;
	     * })  //  [1, 2]
	     * </pre>
		 */
		filter: function (fn, scope) {
			assert.isFunction(fn, "Array#filter(fn, scope): {fn} ~");
			var r = [];
			ap.forEach.call(this, function (value, i, array) {
				if (fn.call(scope, value, i, array))
					r.push(value);
			});
			return r;
		},

		/**
		 * 遍历当前数组，并对数组的每个元素执行函数 *fn*。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 可以让函数返回 **false** 来强制中止循环。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @see #each
		 * @see Object.each
		 * @see #filter
		 * @see Object.map
		 * @remark
		 * 在高版本浏览器中，forEach 和 each 功能大致相同，但是 forEach 不支持通过 return false 中止循环。
		 * 在低版本(IE8-)浏览器中， forEach 为 each 的别名。
		 *
		 * 目前除了 IE8-，主流浏览器都已内置此函数。
		 * @example 以下示例演示了如何遍历数组，并输出每个元素的值。
		 * <pre>
	     * [2, 5].forEach(function (value, key) {
	     * 		trace(value);
	     * });
	     * // 输出 '2' '5'
	     * </pre>
		 */
		forEach: each

		/// #endif

	});

	/// #endregion

	/// #region Private Functions

	/**
	 * 复制所有属性到任何对象。
	 * @param {Object} dest 复制目标。
	 * @param {Object} src 要复制的内容。
	 * @return {Object} 复制后的对象。
	 */
	function extend(dest, src) {

		assert(dest != null, "Object.extend(dest, src): {dest} 不可为空。", dest);

		// 直接遍历，不判断是否为真实成员还是原型的成员。
		for (var key in src)
		    dest[key] = src[key];
		return dest;
	}

	/**
	 * 对数组运行一个函数。
	 * @param {Function} fn 遍历的函数。参数依次 value, index, array 。
	 * @param {Object} scope 对象。
	 * @return {Boolean} 返回一个布尔值，该值指示本次循环时，有无出现一个函数返回 false 而中止循环。
	 */
	function each(fn, scope) {

		assert(typeof fn === 'function', "Array#each(fn, scope): {fn} 必须是一个函数。", fn);

		var i = -1, me = this;

		while (++i < me.length)
			if (fn.call(scope, me[i], i, me) === false)
				return false;
		return true;
	}

	/**
	 * 所有自定义类的基类。
	 */
	function Base() {

	}

	/**
	 * 空函数。
	 */
	function emptyFn() {

	}

	/**
	 * 将一个字符转为大写。
	 * @param {String} ch 参数。
	 * @param {String} match 字符。
	 * @return {String} 转为大写之后的字符串。
	 */
	function toUpperCase(ch, match) {
		return match.toUpperCase();
	}

	/**
	 * 获取指定的对象所有的事件管理器。
	 * @param {Object} obj 要使用的对象。
	 * @param {String} type 事件名。
	 * @return {Object} 符合要求的事件管理器，如果找不到合适的，返回默认的事件管理器。
	 */
	function getMgr(obj, eventName) {
		var clazz = obj.constructor, 
			t;

		// 遍历父类，找到指定事件。
		while (!(t = clazz.$event) || !(eventName in t)) {
			if (!(clazz = clazz.base)) {
				return emptyObj;
			}
		}

		return t[eventName];
	}

	/// #endregion

})(this);

/// #if !Publish

JPlus.Base.prototype.toString = function () {
	for (var item in window) {
		if (window[item] === this.constructor)
			return item;
	}

	return Object.prototype.toString.call(this);
};

/**
 * Debug Tools
 */

/**
 * 调试输出指定的信息。
 * @param {Object} ... 要输出的变量。
 */
function trace() {

	// 无参数的话，自动补充一个参数。
	if (arguments.length === 0) {
		if (!trace.$count)
			trace.$count = 0;
		return trace('(trace: ' + (trace.$count++) + ')');
	}


	if (trace.enable) {

		var hasConsole = window.console, data;

		// 优先使用 console.debug
		if (hasConsole && console.debug && console.debug.apply) {
			return console.debug.apply(console, arguments);
		}

		// 然后使用 console.log
		if (hasConsole && console.log && console.log.apply) {
			return console.log.apply(console, arguments);
		}
		
		// 最后使用 trace.inspect
		for (var i = 0, r = []; i < arguments.length; i++) {
			r[i] = trace.inspect(arguments[i]);
		}

		data = r.join(' ');

		return hasConsole && console.log ? console.log(data) : alert(data);
	}
}

/**
 * 确认一个值是 **true**，否则向用户显示一个警告。
 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。
 * @param {Object} ... 用于格式化 message 中被 {} 包围的参数名的具体值。
 * @return {Boolean} 返回 *value* 的等效布尔值。
 * @example <pre>
 * var value = 1;
 * assert(value > 0, "{value} 应该大于 0。", value);
 * </pre>
 */
function assert(value, message) {
	if (!value) {

		var args = arguments;

		switch (args.length) {
			case 1:
				message = "断言失败";
			case 2:
				break;
			case 0:
				return true;
			default:
				var i = 2;
				message = message.replace(/\{([\w\.\(\)]*?)\}/g, function (match, argsName) {
					return "参数 " + (args.length <= i ? match : argsName + " = " + trace.ellipsis(trace.inspect(args[i++]), 200));
				});
		}

		// 显示调用堆栈。
		if (assert.stackTrace) {

			// 函数调用源。
			args = args.callee.caller;

			// 跳过 assert 函数。
			while (args && args.debugStepThrough)
				args = args.caller;

			// 找到原调用者。
			if (args && args.caller) {
				args = args.caller;
			}

			if (args)
				message += "\r\n--------------------------------------------------------------------\r\n" + trace.ellipsis(trace.decodeUTF8(args.toString()), 600);

		}

		window.trace.error(message);

	}

	return !!value;
}

/**
 * 载入一个组件的 js 和 css源码。
 * @param {String} namespace 组件全名。
 * @example <pre>
 * using("System.Dom.Keys");
 * </pre>
 */
function using(namespace, isStyle) {

	assert.isString(namespace, "using(ns): {ns} 不是合法的组件全名。");

	var cache = using[isStyle ? 'styles' : 'scripts'];

	for (var i = 0; i < cache.length; i++) {
		if (cache[i] === namespace)
			return;
	}

	cache.push(namespace);

	namespace = using.resolve(namespace, isStyle);

	var tagName,
    	type,
    	exts,
    	callback;

	if (isStyle) {
		tagName = "LINK";
		type = "href";
		exts = [".css"];
		callback = using.loadStyle;

	} else {
		tagName = "SCRIPT";
		type = "src";
		exts = [".js"];
		callback = using.loadScript;
	}

	// 如果在节点找到符合的就返回，找不到，调用 callback 进行真正的 加载处理。

	var doms = document.getElementsByTagName(tagName),
		path = namespace.replace(/^[\.\/\\]+/, "");

	for (var i = 0; doms[i]; i++) {
		var url = ((document.constructor ? doms[i][type] : doms[i].getAttribute(type, 4)) || '');
		for (var j = 0; j < exts.length; j++) {
			if (url.indexOf(path + exts[j]) >= 0) {
				return;
			}
		}
	}

	callback(using.rootPath + namespace + exts[0]);
}

/**
 * 导入指定组件全名表示的样式文件。
 * @param {String} namespace 组件全名。
 */
function imports(namespace) {
	return using(namespace, true);
}

(function () {

	/// #region Trace

	/**
     * @namespace trace
     */
	extend(trace, {

		/**
		 * 是否打开调试输出。
		 * @config {Boolean}
		 */
		enable: true,

		/**
		 * 将字符串限定在指定长度内，超出部分用 ... 代替。
		 * @param {String} value 要处理的字符串。
		 * @param {Number} length 需要的最大长度。
		 * @example
		 * <pre>
	     * String.ellipsis("1234567", 6); //   "123..."
	     * String.ellipsis("1234567", 9); //   "1234567"
	     * </pre>
		 */
		ellipsis: function (value, length) {
			return value.length > length ? value.substr(0, length - 3) + "..." : value;
		},

		/**
         * 将字符串从 utf-8 字符串转义。
         * @param {String} s 字符串。
         * @return {String} 返回的字符串。
         */
		decodeUTF8: function (s) {
			return s.replace(/\\u([0-9a-f]{3})([0-9a-f])/gi, function (a, b, c) {
				return String.fromCharCode((parseInt(b, 16) * 16 + parseInt(c, 16)))
			})
		},

		/**
         * 获取对象的字符串形式。
         * @param {Object} obj 要输出的内容。
         * @param {Number/undefined} deep=0 递归的层数。
         * @return String 成员。
         */
		inspect: function (obj, deep, showArrayPlain) {

			if (deep == null)
				deep = 3;
			switch (typeof obj) {
				case "function":
					// 函数
					return deep >= 3 ? trace.decodeUTF8(obj.toString()) : "function ()";

				case "object":
					if (obj == null)
						return "null";
					if (deep < 0)
						return obj.toString();

					if (typeof obj.length === "number") {
						var r = [];
						for (var i = 0; i < obj.length; i++) {
							r.push(trace.inspect(obj[i], ++deep));
						}
						return showArrayPlain ? r.join("   ") : ("[" + r.join(", ") + "]");
					} else {
						if (obj.setInterval && obj.resizeTo)
							return "window#" + obj.document.URL;
						if (obj.nodeType) {
							if (obj.nodeType == 9)
								return 'document ' + obj.URL;
							if (obj.tagName) {
								var tagName = obj.tagName.toLowerCase(), r = tagName;
								if (obj.id) {
									r += "#" + obj.id;
									if (obj.className)
										r += "." + obj.className;
								} else if (obj.outerHTML)
									r = obj.outerHTML;
								else {
									if (obj.className)
										r += " class=\"." + obj.className + "\"";
									r = "<" + r + ">" + obj.innerHTML + "</" + tagName + ">  ";
								}

								return r;
							}

							return '[Node type=' + obj.nodeType +' name=' + obj.nodeName + ' value=' + obj.nodeValue + ']';
						}
						var r = "{\r\n", i, flag = 0;
						for (i in obj) {
							if (typeof obj[i] !== 'function')
								r += "\t" + i + " = " + trace.inspect(obj[i], deep - 1) + "\r\n";
							else {
								flag++;
							}
						}

						if (flag) {
							r += '\t... (' + flag + '个函数)\r\n';
						}

						r += "}";
						return r;
					}
				case "string":
					return deep >= 3 ? obj : '"' + obj + '"';
				case "undefined":
					return "undefined";
				default:
					return obj.toString();
			}
		},

		/**
         * 输出方式。 {@param {String} message 信息。}
         * @type Function
         */
		log: function (message) {
			if (trace.enable && window.console && console.log) {
				window.console.log(message);
			}
		},

		/**
         * 输出一个错误信息。
         * @param {Object} msg 内容。
         */
		error: function (msg) {
			if (trace.enable) {
				if (window.console && console.error)
					window.console.error(msg); // 这是一个预知的错误，请根据函数调用堆栈查找错误原因。
				else
					throw msg; // 这是一个预知的错误，请根据函数调用堆栈查找错误原因。
			}
		},

		/**
         * 输出一个警告信息。
         * @param {Object} msg 内容。
         */
		warn: function (msg) {
			if (trace.enable) {
				if (window.console && console.warn)
					window.console.warn(msg);
				else
					window.trace("[警告]" + msg);
			}
		},

		/**
         * 输出一个信息。
         * @param {Object} msg 内容。
         */
		info: function (msg) {
			if (trace.enable) {
				if (window.console && console.info)
					window.console.info(msg);
				else
					window.trace.write("[信息]" + msg);
			}
		},

		/**
         * 遍历对象每个元素。
         * @param {Object} obj 对象。
         */
		dir: function (obj) {
			if (trace.enable) {
				if (window.console && console.dir)
					window.console.dir(obj);
				else if (obj) {
					var r = "", i;
					for (i in obj)
						r += i + " = " + trace.inspect(obj[i], 1) + "\r\n";
					window.trace(r);
				}
			}
		},

		/**
         * 清除调试信息。 (没有控制台时，不起任何作用)
         */
		clear: function () {
			if (window.console && console.clear)
				window.console.clear();
		},

		/**
         * 如果是调试模式就运行。
         * @param {String/Function} code 代码。
         * @return String 返回运行的错误。如无错, 返回空字符。
         */
		eval: function (code) {
			if (trace.enable) {
				try {
					typeof code === 'function' ? code() : eval(code);
				} catch (e) {
					return e;
				}
			}
			return "";
		},

		/**
         * 输出一个函数执行指定次使用的时间。
         * @param {Function} fn 函数。
         */
		time: function (fn) {
			var time = 0,
				currentTime,
				start = +new Date(),
				past;

			try {

				do {

					time += 10;

					currentTime = 10;
					while (--currentTime > 0) {
						fn();
					}

					past = +new Date() - start;

				} while (past < 100);

			} catch (e) {

			}
			window.trace("[时间] " + past / time);
		}

	});

	/// #region Assert

	/**
     * @namespace assert
     */
	extend(assert, {

		/**
		 * 是否在 assert 失败时显示函数调用堆栈。
		 * @config {Boolean} stackTrace
		 */
		stackTrace: true,
		
		debugStepThrough: true,
		
		/**
		 * 指示一个函数已过时。
		 * @param {String} message="此成员已过时" 提示的信息。
		 */
		deprected: function(message) {
			trace.warn(message || "此成员已过时");
		},

		/**
         * 确认一个值为函数。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         * @example <pre>
         * assert.isFunction(a, "a ~");
         * </pre>
         */
		isFunction: createAssertFunc(function (value) {
			return typeof value == 'function';
		}, "必须是函数。"),

		/**
         * 确认一个值为数组。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isArray: createAssertFunc(function (value) {
			return typeof value.length == 'number';
		}, "必须是数组。"),

		/**
         * 确认一个值为数字。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isNumber: createAssertFunc(function (value) {
			return typeof value === "number" || value instanceof Number;
		}, "必须是数字。"),

		/**
         * 确认一个值是字符串。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isString: createAssertFunc(function (value) {
			return typeof value === "string" || value instanceof String;
		}, "必须是字符串。"),

		/**
         * 确认一个值是日期。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isDate: createAssertFunc(function (value) {
			return value && value instanceof Date;
		}, "必须是日期对象。"),

		/**
         * 确认一个值是正则表达式。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isRegExp: createAssertFunc(function (value) {
			return value && value instanceof RegExp;
		}, "必须是正则表达式。"),

		/**
         * 确认一个值为函数变量。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isObject: createAssertFunc(function (value) {
			return value && (typeof value === "object" || typeof value === "function" || typeof value.nodeType === "number");
		}, "必须是一个引用对象。"),

		/**
         * 确认一个值为节点。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isNode: createAssertFunc(function (value) {
			return value ? typeof value.nodeType === "number" || value.setTimeout : value === null;
		}, "必须是 DOM 节点。"),

		/**
         * 确认一个值为节点。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isElement: createAssertFunc(function (value) {
			return value ? typeof value.nodeType === "number" && value.style : value === null;
		}, "必须是 DOM 元素。"),

		/**
         * 确认一个值非空。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		notNull: createAssertFunc(function (value) {
			return value != null;
		}, "不可为空。")

	});

	function createAssertFunc(assertFunction, defaultMessage) {
		var fn = function (value, message) {
			return assert(assertFunction(value), (message || "断言失败。").replace('~', defaultMessage), value)
		};
		fn.debugStepThrough = true;
		return fn;
	}

	/// #endregion

	/// #region Using

	extend(using, {

		/**
         * 同步载入代码。
         * @param {String} uri 地址。
         * @example <pre>
         * JPlus.loadScript('./v.js');
         * </pre>
         */
	    loadScript: function (url) {

	        var src = using.loadText(url);

	        if(src){
	            try {
	                if(window.execScript) {
	                    window.execScript(src);
	                } else {
	                    window["eval"].call(window, src);
	                }
	            } catch (e) {
	                trace.error("执行 " + url + " 出现错误: " + e.toString());
	            } 
	        }
		},

		/**
         * 异步载入样式。
         * @param {String} uri 地址。
         * @example <pre>
         * JPlus.loadStyle('./v.css');
         * </pre>
         */
		loadStyle: function (url) {

			// 在顶部插入一个css，但这样肯能导致css没加载就执行 js 。所以，要保证样式加载后才能继续执行计算。
			return document.getElementsByTagName("HEAD")[0].appendChild(extend(document.createElement('link'), {
				href: url,
				rel: 'stylesheet',
				type: 'text/css'
			}));
		},

		/**
         * 同步载入文本。
         * @param {String} uri 地址。
         * @param {Function} [callback] 对返回值的处理函数。
         * @return {String} 载入的值。 因为同步，所以无法跨站。
         * @example <pre>
         * trace(  JPlus.loadText('./v.html')  );
         * </pre>
         */
		loadText: function (url) {

			// 新建请求。
			// 下文对 XMLHttpRequest 对象进行兼容处理。
		    var xmlHttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"),
		        status;

			try {

				// 打开请求。
				xmlHttp.open("GET", url, false);

				// 发送请求。
				xmlHttp.send(null);

                // 获取返回的状态码。
				status = xmlHttp.status;

                // 判断状态码是否合格。
				if ((status >= 200 && status < 300) || status == 304 || status == 1223) {
				    // 返回相应内容。
				    return xmlHttp.responseText;
				} else {
				    throw "服务器返回状态码 " + status;
				}

			} catch (e) {

			    // 调试输出。
			    trace.error("请求失败: " + url + " \r\n\t原因: " + (window.location.protocol == "file:" ? " 本网页是使用 file 协议打开的，请改用 http 协议。" : e.toString()));

			} finally {

				// 释放资源。
				xmlHttp = null;
			}

		},

		/**
         * 全部已载入的样式。
         * @type Array
         * @private
         */
		styles: [],

		/**
         * 全部已载入的组件全名。
         * @type Array
         * @private
         */
		scripts: [],

		/**
         * JPlus 安装的根目录, 可以为相对目录。
         * @config {String}
         */
		rootPath: (function () {
			try {
				var scripts = document.getElementsByTagName("script");

				// 当前脚本在 <script> 引用。最后一个脚本即当前执行的文件。
				scripts = scripts[scripts.length - 1];

				// IE6/7 使用 getAttribute
				scripts = !document.constructor ? scripts.getAttribute('src', 4) : scripts.src;

				// 设置路径。
				return (scripts.match(/([\S\s]*\/)System\/Core\/assets\/scripts\//) || [0, ""])[1];

			} catch (e) {

				// 出错后，设置当前位置.
				return "";
			}

		})(),

		/**
         * 将指定的组件全名转为路径。
         * @param {String} namespace 组件全名。
         * @param {Boolean} isStyle=false 是否为样式表。
         */
		resolve: function (namespace, isStyle) {
			return namespace.replace(/^([^.]+\.[^.]+)\./, isStyle ? '$1.assets.styles.' : '$1.assets.scripts.').replace(/\./g, '/');
		}

	});

	/// #endregion

	/// #endregion

	/**
	 * 复制所有属性到任何对象。
	 * @param {Object} dest 复制目标。
	 * @param {Object} src 要复制的内容。
	 * @return {Object} 复制后的对象。
	 */
	function extend(dest, src) {

		assert(dest != null, "Object.extend(dest, src): {dest} 不可为空。", dest);

		// 直接遍历，不判断是否为真实成员还是原型的成员。
		for (var b in src)
			dest[b] = src[b];
		return dest;
	}

})();

/// #endif

