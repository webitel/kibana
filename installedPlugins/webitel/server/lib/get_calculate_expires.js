export default (server) => {
  const ttl = server.config().get('shield.sessionTimeout');
  return () => Date.now() + ttl;
};
