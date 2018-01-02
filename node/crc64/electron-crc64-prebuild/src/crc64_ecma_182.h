/**
 * CRC64.js - Implement of CRC64 for Node.js Edit
 *
 * Copyright (c) 2017 Souche Koumakan Group
 *
 * MIT LIcense <https://github.com/souche-koumakan/crc64.js/blob/master/LICENSE>
 */
#ifndef __CRC64_ECMA_182_H__
#define __CRC64_ECMA_182_H__

/**
 * This code refers to
 *
 *   http://www.codegists.com/snippet/c/crc64c_terribleplan_c
 *
 * This is the original comment:
 * ------------------------------------
 *
 * crc64.c -- compute CRC-64
 * Copyright (C) 2013 Mark Adler
 * Version 1.4  16 Dec 2013  Mark Adler
 *
 * ------------------------------------
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the author be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 *  including commercial applications, and to alter it and redistribute it
 *  freely, subject to the following restrictions:
 *
 *  1. The origin of this software must not be misrepresented; you must not
 *     claim that you wrote the original software. If you use this software
 *     in a product, an acknowledgment in the product documentation would be
 *     appreciated but is not required.
 *  2. Altered source versions must be plainly marked as such, and must not be
 *     misrepresented as being the original software.
 *  3. This notice may not be removed or altered from any source distribution.
 *
 *  Mark Adler
 *  madler@alumni.caltech.edu
 *
 * ------------------------------------
 *
 * Compute CRC-64 in the manner of xz, using the ECMA-182 polynomial,
 * bit-reversed, with one's complement pre and post processing.  Provide a
 * means to combine separately computed CRC-64's.
 *
 * ------------------------------------
 *
 * Version history:
 * 1.0  13 Dec 2013  First version
 * 1.1  13 Dec 2013  Fix comments in test code
 * 1.2  14 Dec 2013  Determine endianess at run time
 * 1.3  15 Dec 2013  Add eight-byte processing for big endian as well
 *                   Make use of the pthread library optional
 * 1.4  16 Dec 2013  Make once variable volatile for limited thread protection
 */
#include <stdlib.h>
#include <stdint.h>

namespace crc64js_base {

/* Fill in the CRC-64 constants table. */
void crc64_init();

/**
 * Return the CRC-64 of buf[0..len-1] with initial crc, processing eight bytes
 * at a time.  This selects one of two routines depending on the endianess of
 * the architecture.  A good optimizing compiler will determine the endianess
 * at compile time if it can, and get rid of the unused code and table.  If the
 * endianess can be changed at run time, then this code will handle that as
 * well, initializing and using two tables, if called upon to do so.
 */
uint64_t crc64(uint64_t crc, void* buf, size_t len);

}

#endif
