#include <node.h>
#include <node_buffer.h>
#include <stdint.h>
#include <string>
#include <sstream>
#include <iostream>
namespace demo{

    #define POLY UINT64_C(0xc96c5795d7870f42)

    static uint64_t crc64_little_table[8][256];
    static uint64_t crc64_big_table[8][256];


    /* Fill in the CRC-64 constants table. */
    static void crc64_init(uint64_t table[][256])
    {
        unsigned n, k;
        uint64_t crc;

        /* generate CRC-64's for all single byte sequences */
        for (n = 0; n < 256; n++) {
            crc = n;
            for (k = 0; k < 8; k++)
                crc = crc & 1 ? POLY ^ (crc >> 1) : crc >> 1;
            table[0][n] = crc;
        }

        /* generate CRC-64's for those followed by 1 to 7 zeros */
        for (n = 0; n < 256; n++) {
            crc = table[0][n];
            for (k = 1; k < 8; k++) {
                crc = table[0][crc & 0xff] ^ (crc >> 8);
                table[k][n] = crc;
            }
        }


        //std::cout<<"CRC64:initial table success!"<<std::endl;
    }


    /* This function is called once to initialize the CRC-64 table for use on a
    little-endian architecture. */
    static void crc64_little_init()
    {
        crc64_init(crc64_little_table);
    }


    /* Reverse the bytes in a 64-bit word. */
    static __inline  uint64_t rev8(uint64_t a)
    {
        uint64_t m;

        m = UINT64_C(0xff00ff00ff00ff);
        a = ((a >> 8) & m) | (a & m) << 8;
        m = UINT64_C(0xffff0000ffff);
        a = ((a >> 16) & m) | (a & m) << 16;
        return a >> 32 | a << 32;
    }


    /* This function is called once to initialize the CRC-64 table for use on a
    big-endian architecture. */
    static void crc64_big_init()
    {
        crc64_init(crc64_big_table);
        for (unsigned k = 0; k < 8; k++)
            for (unsigned n = 0; n < 256; n++)
                crc64_big_table[k][n] = rev8(crc64_big_table[k][n]);
    }

    #ifdef PTHREAD_ONCE_INIT
    #  define ONCE(init) \
        do { \
            static pthread_once_t once = PTHREAD_ONCE_INIT; \
            pthread_once(&once, init); \
            } while (0)
    #else
    #  define ONCE(init) \
        do { \
            static volatile int once = 1; \
            if (once) { \
                if (once++ == 1) { \
                    init(); \
                    once = 0; \
                            } \
                            else \
                                            while (once) \
                        ; \
                    } \
            } while (0)
    #endif


    /* Calculate a CRC-64 eight bytes at a time on a little-endian architecture. */
    static __inline  uint64_t crc64_little(uint64_t crc, void *buf, size_t len)
    {
        unsigned char *next = static_cast<unsigned char*>(buf);

        ONCE(crc64_little_init);
        crc = ~crc;
        while (len && ((uintptr_t)next & 7) != 0) {
            crc = crc64_little_table[0][(crc ^ *next++) & 0xff] ^ (crc >> 8);
            len--;
        }
        while (len >= 8) {
            crc ^= *(uint64_t *)next;
            crc = crc64_little_table[7][crc & 0xff] ^
                crc64_little_table[6][(crc >> 8) & 0xff] ^
                crc64_little_table[5][(crc >> 16) & 0xff] ^
                crc64_little_table[4][(crc >> 24) & 0xff] ^
                crc64_little_table[3][(crc >> 32) & 0xff] ^
                crc64_little_table[2][(crc >> 40) & 0xff] ^
                crc64_little_table[1][(crc >> 48) & 0xff] ^
                crc64_little_table[0][crc >> 56];
            next += 8;
            len -= 8;
        }
        while (len) {
            crc = crc64_little_table[0][(crc ^ *next++) & 0xff] ^ (crc >> 8);
            len--;
        }
        return ~crc;
    }


    /* Calculate a CRC-64 eight bytes at a time on a big-endian architecture. */
    static __inline uint64_t crc64_big(uint64_t crc, void *buf, size_t len)
    {
        unsigned char *next = static_cast<unsigned char*>(buf);

        ONCE(crc64_big_init);
        crc = ~rev8(crc);
        while (len && ((uintptr_t)next & 7) != 0) {
            crc = crc64_big_table[0][(crc >> 56) ^ *next++] ^ (crc << 8);
            len--;
        }
        while (len >= 8) {
            crc ^= *reinterpret_cast<uint64_t *>(next);
            crc = crc64_big_table[0][crc & 0xff] ^
                crc64_big_table[1][(crc >> 8) & 0xff] ^
                crc64_big_table[2][(crc >> 16) & 0xff] ^
                crc64_big_table[3][(crc >> 24) & 0xff] ^
                crc64_big_table[4][(crc >> 32) & 0xff] ^
                crc64_big_table[5][(crc >> 40) & 0xff] ^
                crc64_big_table[6][(crc >> 48) & 0xff] ^
                crc64_big_table[7][crc >> 56];
            next += 8;
            len -= 8;
        }
        while (len) {
            crc = crc64_big_table[0][(crc >> 56) ^ *next++] ^ (crc << 8);
            len--;
        }
        return ~rev8(crc);
    }

    /* Return the CRC-64 of buf[0..len-1] with initial crc, processing eight bytes
    at a time.  This selects one of two routines depending on the endianess of
    the architecture.  A good optimizing compiler will determine the endianess
    at compile time if it can, and get rid of the unused code and table.  If the
    endianess can be changed at run time, then this code will handle that as
    well, initializing and using two tables, if called upon to do so. */
    uint64_t aos_crc64(uint64_t crc, void *buf, size_t len)
    {
        uint64_t n = 1;

        return *reinterpret_cast<char *>(&n) ? crc64_little(crc, buf, len) :
            crc64_big(crc, buf, len);
    }

    uint64_t StringToInt(std::string str){
        std::stringstream strstream;
        uint64_t result;
        strstream << str;
        strstream >> result;
        return result;
    }

    std::string IntToString(uint64_t value){
        //return std::to_string(value);
        std::stringstream strstream;
        strstream << value;
        return strstream.str();
    }

    std::string V8StringToString(v8::Local<v8::String> str){
        v8::String::Utf8Value param1(str);
        return std::string(*param1);
    }

    uint64_t V8StringToInt(v8::Local<v8::String> str){
        return StringToInt(V8StringToString(str));
    }


    void crc64(const v8::FunctionCallbackInfo<v8::Value> &args){
        v8::Isolate* isolate = args.GetIsolate();

        v8::Local<v8::Object> bufferObj = args[1]->ToObject();
        char* bufferData = node::Buffer::Data(bufferObj);
        size_t bufferLength = node::Buffer::Length(bufferObj);

        auto init_crc = V8StringToInt(args[0]->ToString());

        auto value = aos_crc64(init_crc, (void*)bufferData, bufferLength);

        //std::cout<<"init_crc:"<<init_crc<<" buffer:"<<bufferData<<" length:"<<bufferLength<<std::endl;

        auto res = IntToString(value);

        v8::Local<v8::String> result = v8::String::NewFromUtf8(isolate,res.c_str());

        args.GetReturnValue().Set(result);
    }

    void Init(v8::Local<v8::Object> exports){
       NODE_SET_METHOD(exports, "get", crc64);
    }


    NODE_MODULE(addon, Init)
}
