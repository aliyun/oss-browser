cmd_Release/obj.target/crc64.node := g++ -shared -pthread -rdynamic -m64  -Wl,-soname=crc64.node -o Release/obj.target/crc64.node -Wl,--start-group Release/obj.target/crc64/crc64.o -Wl,--end-group 
