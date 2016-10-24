(function() {
    Object.prototype.$ = function(x) {
        var that = this == window ? document : this
        return Array.prototype.slice.call(that.querySelectorAll(x), 0)
    }
    var isFireFox = (function() {
        if (navigator.userAgent.toLowerCase().indexOf("firefox") < 0) return false
        return true
    })()

    function addEvent(event, callback, tar) {
        var obj = tar ? tar : window
        if (event == "mousewheel" || event == "DOMMouseScroll") {
            if (isFireFox) event = "DOMMouseScroll"
        }
        if (window.addEventListener)
            obj.addEventListener(event, callback)
        else if (window.attachEvent)
            obj.attachEvent("on" + event, callback)
        else obj["on" + event] = callback
    }

    function removeEvent(event, callback, tar) {
        var obj = tar ? tar : window
        if (event == "mousewheel" || event == "DOMMouseScroll") {
            if (isFireFox) event = "DOMMouseScroll"
        }
        if (window.removeEventListener)
            obj.removeEventListener(event, callback)
        else if (window.detachEvent)
            obj.detachEvent("on" + event, callback)
        else obj["on" + event] = null
    }

    var Croppy = (function() {

        function Croppy(item) {
            var that = this

            this.father = item.parentElement
            this.stack = []
            this.ntstack = []
            this.lock = false
            this.op = 0
            this.drag = false
            this.delta = 1
            this.angle = 0
            this.setting = Object.prototype.Croppy.Default

            this.ele = item
            this.image = new Image()
            this.image.src = item.src

            this.width = this.setting.width
            this.height = this.setting.height
            this.degree = this.setting.degree

            addEvent("load", function() {
                that.init()
            }, this.image)
        }

        Croppy.prototype = {
            init: function() {
                console.log("init")
                this.canvas = this.father.$(this.setting.selector.canvas)[0]

                //canvas-cover 
                this.floor = this.father.$(this.setting.selector.floor)[0]

                this.layer = this.father.$(this.setting.selector.layer)[0]

                this.canvas.width = this.floor.width = this.width
                this.canvas.height = this.floor.height = this.height

                //selector
                this.clip = this.father.$(this.setting.selector.clip)[0]

                this.earase = this.father.$(this.setting.selector.earase)[0]

                this.match = this.father.$(this.setting.selector.wordmatch)[0]

                this.clock = this.father.$(this.setting.selector.clock)[0]

                this.unclock = this.father.$(this.setting.selector.unclock)[0]

                this.deg = this.father.$(this.setting.selector.deg)[0]

                this.preStep = this.father.$(this.setting.selector.preStep)[0]

                this.nextStep = this.father.$(this.setting.selector.nextStep)[0]

                this.reset = this.father.$(this.setting.selector.reset)[0]

                this.close = this.father.$(this.setting.selector.close)[0]

                console.log(this.clip)

                this._initcanvas()
                this._initEvent()
            },

            _clip: function() {
                var canvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d")
                canvas.width = this.nowx - this.prex
                canvas.height = this.nowy - this.prey

                ctx.drawImage(this.canvas, this.prex, this.prey, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)

                var ret = {
                    x0: this.prex,
                    y0: this.prey,
                    width: this.nowx - this.prex,
                    height: this.nowy - this.prey,
                    src: canvas.toDataURL("image/png")
                }

                $("#test")[0].src = ret.src
            },

            _earase: function() {
                this.ctx.fillStyle = "#fff"
                this.ctx.fillRect(this.prex, this.prey, this.nowx - this.prex, this.nowy - this.prey)


                console.log("fill!")

            },
            _rotMarix: function(deg) {
                var x = this.initx,
                    y = this.inity,
                    cosd = Math.cos(deg),
                    sind = Math.sin(deg)
                this.initx = x * cosd - sind * y
                this.inity = sind * x + cosd * y
            },
            _clock: function(op) {
                var ctx = this.ctx,
                    pideg = this.angle += Math.PI * this.degree / 180 * (op ? 1 : -1)
                ctx.save()
                ctx.clearRect(0, 0, this.width, this.height)
                ctx.translate(this.width / 2, this.height / 2)

                ctx.rotate(pideg)
                ctx.translate(-this.width / 2, -this.height / 2)

                // this._rotMarix(pideg)
                console.log(pideg)
                ctx.drawImage(this.image, this.initx, this.inity, this.image.width, this.image.height)
                ctx.restore()

                $("#test")[0].src = this.canvas.toDataURL("image/png")
            },



            _match: function() {

            },

            _nextStep: function() {

            },

            _preStep: function() {

            },

            _reset: function() {
                this.image.src = this.ele.src
                this.ctx.clearRect(0, 0, this.width, this.height)
                this.ctx.drawImage(this.image, this.originx, this.originy)
            },

            _resize: function() {

            },

            _close: function() {
                //remember to remove the event
            },

            _mouseDown: function(e) {
                e = e || window.event

                var x = e.clientX || e.pageX,
                    y = e.clientY || e.clientY
                if (x < this.baseX || x > this.baseX + this.width || y < this.baseY || y > this.baseY + this.height) return
                console.log("down")
                this.prex = x - this.baseX
                this.prey = y - this.baseY
                this.drag = true
            },

            _mouseMove: function(e) {
                if (!this.drag) return
                e = e || window.event

                var x = (e.clientX || e.pageX) - this.baseX,
                    y = (e.clientY || e.pageY) - this.baseY
                console.log(x, y)
                this.nowx = x <= 0 ? 0 : (x >= this.width ? this.width : x)
                this.nowy = y <= 0 ? 0 : (y >= this.height ? this.height : y)

                this.drawrect()
            },

            _mouseUp: function(e) {
                if (!this.drag) return
                this.drag = false
                if (this.op > 0) {
                    // clip is 1
                    console.log("clip")
                    this._clip()

                } else {
                    // earase is -1 
                    console.log("earase")
                    this._earase()
                }
            },
            _zoom: function(orix, oriy) {
                var ctx = this.ctx
                ctx.save()
                ctx.clearRect(0, 0, this.width, this.height)
                ctx.translate(orix, oriy)
                ctx.scale(this.delta, this.delta)
                ctx.translate(-orix, -oriy)
                ctx.drawImage(this.image, this.initx, this.inity)

                ctx.restore()

            },

            _mouseScroll: function(e) {
                e = e || window.event
                var delta = e.detail || -e.wheelDelta

                this.delta += delta / this.setting.speed
                if (this.delta <= 0.1) this.delta = 0.1
                var that = this
                setTimeout(function() {
                    that._zoom(e.offsetX, e.offsetY)
                }, 0)
                console.log(this.delta)
                e.preventDefault() || (e.returnValue = false)
                return false
            },

            drawrect: function() {

                this.ctx2.clearRect(0, 0, this.width, this.height)
                this.ctx2.strokeStyle = "#39f"

                this.ctx2.strokeRect(this.prex, this.prey, this.nowx - this.prex, this.nowy - this.prey)
            },

            _getScale: function() {
                var ratio = this.width / this.height,
                    img_ratio = this.image.width / this.image.height,
                    initx = 0,
                    inity = 0

                console.log(this.image.width)
                if (img_ratio > ratio) {
                    initx = 0
                    inity = (this.height - this.width / img_ratio) / 2
                    this.image.width = this.width
                    this.image.height = this.height - inity * 2
                } else {
                    inity = 0
                    initx = (this.width - this.height * img_ratio) / 2
                    this.image.width = this.width - initx * 2
                    this.image.height = this.height
                }

                return { x: initx, y: inity }
            },
            getOffset: function(tar) {
                var obj = tar,
                    x = 0,
                    y = 0
                while (obj) {
                    x += obj.offsetLeft
                    y += obj.offsetTop
                    obj = obj.offsetParent
                }
                return { x: x, y: y }
            },
            _initcanvas: function() {
                this.canvas.style.cssText = "z-index:1100;"
                this.floor.style.cssText = "z-index:1101;"

                var init = this._getScale(),
                    base = this.getOffset(this.layer)
                this.baseX = base.x
                this.baseY = base.y
                this.initx = this.originx = init.x
                this.inity = this.originx = init.y

                this.ctx = this.canvas.getContext('2d')
                this.ctx2 = this.floor.getContext('2d')

                this.ctx.clearRect(0, 0, this.width, this.height)
                this.ctx2.clearRect(0, 0, this.width, this.height)
                console.log(this.image)
                this.ctx.drawImage(this.image, this.initx, this.inity, this.image.width, this.image.height)
            },

            _initEvent: function() {
                var that = this
                addEvent("mousedown", function() {
                    that._mouseDown()
                })
                addEvent("mousemove", function() {
                    that._mouseMove()
                })
                addEvent("mouseup", function() {
                    that._mouseUp()
                })
                addEvent("mousewheel", function() {
                    that._mouseScroll()
                }, this.layer)


                addEvent("click", function() {
                    // that._clip()
                    that.op = 1
                }, this.clip)
                addEvent("click", function() {
                    // that._earase()
                    that.op = -1
                }, this.earase)
                addEvent("click", function() {
                    that._match()
                }, this.match)
                addEvent("click", function() {
                    that._clock(true)
                }, this.clock)
                addEvent("click", function() {
                    that._clock(false)
                }, this.unclock)
                addEvent("click", function() {
                    that._preStep()
                }, this.preStep)
                addEvent("click", function() {
                    that._nextStep()
                }, this.nextStep)
                addEvent("click", function() {
                    that._reset()
                }, this.reset)
                addEvent("click", function() {
                    that._close()
                }, this.close)

                addEvent("change", function() {
                    that.degree = Number(this.value)
                    console.log(that.degree)
                }, this.deg)

                addEvent("resize", this._resize)
            }
        }

        return Croppy
    })()

    Object.prototype.Croppy = function(option) {
        return this.forEach(function(item) {
            var data = item.data

            if (!data) item.data = new Croppy(item)
            else console.log(item)

            return data
        })
    }

    Object.prototype.Croppy.Default = {
        selector: {
            canvas: ".canvas",
            floor: ".canvas-cover",
            layer: ".layer-content",
            cover: ".cover",
            wrapper: ".container",
            clip: ".clip",
            earase: ".earase",
            wordmatch: ".match",
            clock: ".clock",
            unclock: ".unclock",
            deg: ".deg",
            preStep: ".preStep",
            nextStep: ".nextStep",
            reset: ".reset",
            close: ".close"
        },
        width: 850,
        height: 515,
        degree: 10,
        speed: 600 //100-> fast, 1000->slow
    }
})()