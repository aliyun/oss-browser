#include <nan.h>
#include "crc64_ecma_182.h"
#include<sstream>
#include<string>

namespace CRC64JS {

static uint64_t ZERO = 0;

NAN_METHOD(CRC64)
{
    v8::Local<v8::Object> buff = Nan::To<v8::Object>(info[0]).ToLocalChecked();
    v8::Local<v8::Object> ret;

    if(info.Length() > 1)
    {
        ret = Nan::To<v8::Object>(info[1]).ToLocalChecked();
    }
    else
    {
        ret = Nan::CopyBuffer((char*)&ZERO, sizeof(ZERO)).ToLocalChecked();
    }

    uint64_t* crc = (uint64_t*)node::Buffer::Data(ret);
    void* orig_buff = node::Buffer::Data(buff);
    *crc = crc64js_base::crc64(*crc, orig_buff, node::Buffer::Length(buff));

    info.GetReturnValue().Set(ret);
}

NAN_METHOD(ToUInt64String)
{
    v8::Local<v8::Object> ret = Nan::To<v8::Object>(info[0]).ToLocalChecked();

    uint64_t* crc = (uint64_t*)node::Buffer::Data(ret);
    char str[32];
    sprintf(str, "%llu", *crc);

    info.GetReturnValue().Set(Nan::New(str).ToLocalChecked());
}

uint64_t stringToUINT64(const std::string s) {
    std::stringstream a;
    a << s;
    uint64_t ret = 0;
    a >> ret;
    return ret;
}

NAN_METHOD(CombileCRC64) {

    if (info.Length() !=  3) {
        Nan::ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsString() ||  !info[1]->IsString() || !info[2]->IsNumber()) {
      Nan::ThrowTypeError("Wrong arguments");
        return;
    }

    v8::Local<v8::String> ret1 = Nan::To<v8::String>(info[0]).ToLocalChecked();
    Nan::Utf8String val(ret1);
    std::string arg0 = std::string(*val);
    uint64_t crc1 = stringToUINT64(arg0);

    v8::Local<v8::String> ret2 = Nan::To<v8::String>(info[1]).ToLocalChecked();
    Nan::Utf8String val1(ret2);
    std::string arg1 = std::string(*val1);
    uint64_t crc2 = stringToUINT64(arg1);

    v8::Local<v8::String> ret3 = Nan::To<v8::String>(info[2]).ToLocalChecked();
    Nan::Utf8String val3(ret3);
    std::string arg3 = std::string(*val3);
    uint64_t len2 = stringToUINT64(arg3);

    crc1 = crc64js_base::crc64_combine(crc1, crc2, len2);

    std::string asString = std::to_string(crc1);

    info.GetReturnValue().Set(Nan::New(asString).ToLocalChecked());
}

NAN_MODULE_INIT(Init)
{
    crc64js_base::crc64_init();
    Nan::Export(target, "crc64", CRC64);
    Nan::Export(target, "toUInt64String", ToUInt64String);
    Nan::Export(target, "combileCrc64", CombileCRC64);
}

NAN_MODULE_WORKER_ENABLED(crc64, Init)

// NODE_MODULE(crc64, Init)

}
