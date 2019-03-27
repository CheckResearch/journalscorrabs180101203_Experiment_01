function worker_function(){
	var count = 0;
	self.onmessage = function(event)
	{
		const sharedBuffer = event.data;
		const sharedArray = new Uint32Array(sharedBuffer);
		postMessage('start');
		while(true)
		{
			Atomics.add(sharedArray,0,count++);
		}
	};
}

if(window!=self)
  worker_function();