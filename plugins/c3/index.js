export default function (kibana) {
	
	return new kibana.Plugin({
		uiExports: {
			visTypes: [
				'plugins/c3/c3_vis'
      		]
    	}
  	});
};