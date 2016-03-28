(function() {
    function getDateStr(dat) {
        var y = dat.getFullYear();
        var m = dat.getMonth() + 1;
        m = m < 10 ? '0' + m : m;
        var d = dat.getDate();
        d = d < 10 ? '0' + d : d;
        return y + '-' + m + '-' + d;
    }
    function randomBuildData(seed) {
        var returnData = {};
        var dat = new Date("2016-01-01");
        var datStr = '';
        for (var i = 1; i < 92; i++) {
            datStr = getDateStr(dat);
            returnData[datStr] = Math.ceil(Math.random() * seed);
            dat.setDate(dat.getDate() + 1);
        }
        return returnData;
    }

    var aqiSourceData = {
        "北京": randomBuildData(500),
        "上海": randomBuildData(300),
        "广州": randomBuildData(200),
        "深圳": randomBuildData(100),
        "成都": randomBuildData(300),
        "西安": randomBuildData(500),
        "福州": randomBuildData(100),
        "厦门": randomBuildData(100),
        "沈阳": randomBuildData(500)
    };


    // 以上是随机生成的数据


    // 与数据有关的函数放在model命名空间下
    var model = {
        // 保存着随机数据        
        data: aqiSourceData,

        // 接收城市名和粒度，获得一个包含统计数据的数组
        getStatistics: function(city, type) {
            var statisticsResult = [],
                cityData = this.data[city],
                dates = Object.keys(cityData),

                // 该高阶函数负责制造用于reduce的函数
                getCalculatingFunc = function(period) {
                    return function(previousValue, date, index) {
                        var sumUntilNow = previousValue + cityData[date];

                        // 根据周期（1、7或30）的不同，获得不同的平均数
                        if ((index + 1) % period === 0 || index === dates.length) {
                            // 数组的成员是含有date属性和value属性的对象
                            statisticsResult.push({
                                date: date,
                                value: Math.floor(sumUntilNow / period)
                            });
                            return 0;
                        } else {
                            return sumUntilNow;
                        }
                    };
                };

            switch (type) {
                case 'day':
                    dates.reduce(getCalculatingFunc(1), 0);
                    break;

                case 'week':
                    dates.reduce(getCalculatingFunc(7), 0);
                    break;

                case 'month':
                    dates.reduce(getCalculatingFunc(30), 0);
                    break;

                default:
                    throw new Error('不合法的周期。必须是月、周或日');
            }

            return statisticsResult;
        }
    };

    // 把渲染DOM有关的函数放在view命名空间下
    var view = {
        render: function(data) {
            var className,

                // 以div.api-chart-wrap元素作为画布
                canvas = document.querySelector('.api-chart-wrap'),

                // 先找到空气指数的最大值
                maxValue = data.reduce(function(pre, data) {
                    if (data.value > pre) return data.value;
                    else return pre;
                }, 0);

            function getColor(airQuality) {

                // 根据污染严重程度：绿 蓝 红 紫 黑
                var colors = ['#008200', '#0100FD', '#FD0002', '#810381', '#000000'];

                if (airQuality <= 50) return colors[0];
                else if (airQuality < 100) return colors[1];
                else if (airQuality < 200) return colors[2];
                else if (airQuality < 300) return colors[3];
                else return colors[4];
            }

            if (data.length <= 3) className = 'year-bar';
            else if (data.length > 3 && data.length < 90) className = "month-bar";
            else className = "day-bar";

            // 总是先清空画布
            canvas.innerHTML = '';

            data.forEach(function(data) {
                var divEle = document.createElement('div');

                // 设置好高度、背景色等等
                divEle.className = className;
                divEle.title = '日期：' + data.date + '  数值：' + data.value;
                divEle.style.height = (Math.floor((data.value / maxValue) * 100)) + '%';
                divEle.style.backgroundColor = getColor(data.value);

                canvas.appendChild(divEle);
            });
        }


    };

    // 把事件绑定、当前的画布情况等放在controller命名空间下
    var controller = {
        // 这个对象保存着当前画布显示的内容的情况
        // 先设定好初始状况
        _status: {
            gra: document.querySelector('[name="gra-time"]:checked').value,
            city: '北京'
        },

        // 负责绑定事件
        _bind: function() {
            var graTimeForm = document.getElementById('form-gra-time'),
                citySelect = document.getElementById('city-select'),
                that = this;

            // 事件代理。根据表单的变动更改_status的记录
            function changeHandler(e) {
                var target = e.target;
                if (target.matches('input[name="gra-time"]')) {
                    that._status.gra = target.value;
                } else if (target.matches('#city-select')) {
                    that._status.city = target.value;
                } else return true;

                // 根据_status渲染    
                var data = model.getStatistics(that._status.city, that._status.gra);
                view.render(data);
            }

            // 单选input或select一旦有变，则触发事件代理函数
            graTimeForm.addEventListener('click', changeHandler);
            citySelect.addEventListener('change', changeHandler);
        },

        init: function() {
            var citySelect = document.getElementById('city-select');

            // 填充select的选项
            Object.keys(model.data).forEach(function(key) {
                var option = document.createElement('option');
                option.value = option.text = key;
                citySelect.appendChild(option);
            });

            this._bind();

            // 进行初始化的渲染
            var data = model.getStatistics(this._status.city, this._status.gra);
            view.render(data);

        }

    };

    controller.init();

})();