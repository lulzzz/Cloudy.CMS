﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace Cloudy.CMS.ContentTypeSupport.PropertyMappingSupport
{
    public interface IPropertyMappingProvider
    {
        PropertyMapping Get(PropertyInfo property);
    }
}
